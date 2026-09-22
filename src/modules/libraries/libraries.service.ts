import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ChatServiceClient } from '../../common/chat-service/chat-service.client';
import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { PlatformsService } from '../platforms/platforms.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { LibraryResponseDto } from './dto/library-response.dto';
import { LibraryAnalyticsResponseDto } from './dto/library-analytics.dto';

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly platformsService: PlatformsService,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatServiceClient,
  ) {}

  /**
   * Reusable lookup dipakai module lain (Fase 1+) untuk resolve `library_id`
   * milik user login sebelum scoping query Book/Chapter — cukup sebagai
   * helper service method di Fase 0, belum perlu guard generik terpisah
   * (lihat execution-plan.md Fase 0, poin "Ownership guard dasar").
   */
  async findLibraryByOwner(ownerUserId: string): Promise<Library | null> {
    return this.libraryRepo.findOne({ where: { owner_user_id: ownerUserId } });
  }

  async create(ownerUserId: string, dto: CreateLibraryDto): Promise<Library> {
    // Fase 4 (§4.1, 10 Sep 2026; koreksi §4.2, 11 Sep 2026): platformSlug
    // sekarang wajib dari client, resolusi via body eksplisit (BUKAN Host
    // header) — lihat plan/bookpedia/execution-plan.md §4.1/§4.2 (keputusan
    // resolusi Platform). Slug, bukan UUID — lihat doc-comment
    // CreateLibraryDto.platformSlug untuk alasan lengkap.
    const platform = await this.platformsService.getActivePlatformBySlugOrThrow(dto.platformSlug);

    // lockStudio (gantinya platform_config.lockStudio lama, sekarang
    // platforms.lock_studio milik Platform ini): kalau true, TIDAK ADA
    // jalur lewat API untuk bikin Library baru di Platform ini —
    // satu-satunya cara adalah insert manual langsung ke DB oleh tim
    // Bagdja. Sengaja TIDAK ada pengecualian/allowlist di sini (dikonfirmasi
    // eksplisit user, bukan "daftar user yang di-approve lalu tetap boleh
    // lewat form").
    if (platform.lock_studio) {
      throw new ForbiddenException(
        'Pendaftaran penulis baru sedang ditutup sementara. Hubungi admin platform.',
      );
    }

    // MVP: satu Library = satu penulis (solo), lihat overview.md §3 & §4.1 —
    // user yang sudah punya Library tidak boleh membuat lagi.
    const existingForOwner = await this.findLibraryByOwner(ownerUserId);
    if (existingForOwner) {
      throw new ConflictException('User already owns a Library');
    }

    // Cek slug GLOBAL (bukan per-platform) — constraint UNIQUE(slug) lama di
    // DB masih hidup sampai §4.4 (lihat migration 20260910010000), jadi slug
    // masih harus unik lintas-Platform untuk sekarang walau index composite
    // baru sudah ada.
    const existingSlug = await this.libraryRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A library with this slug already exists');
    }

    const library = this.libraryRepo.create({
      platform_id: platform.id,
      owner_user_id: ownerUserId,
      nama: dto.nama,
      slug: dto.slug,
      deskripsi: dto.deskripsi ?? null,
      cover_url: dto.coverUrl ?? null,
    });

    return this.libraryRepo.save(library);
  }

  async update(ownerUserId: string, dto: UpdateLibraryDto): Promise<Library> {
    const library = await this.findLibraryByOwner(ownerUserId);
    if (!library) {
      throw new NotFoundException('User belum punya Library');
    }

    if (dto.nama !== undefined) library.nama = dto.nama;
    if (dto.deskripsi !== undefined) library.deskripsi = dto.deskripsi;
    if (dto.coverUrl !== undefined) library.cover_url = dto.coverUrl;
    if (dto.seoH1 !== undefined) library.seo_h1 = dto.seoH1;
    if (dto.seoTitle !== undefined) library.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) library.seo_description = dto.seoDescription;
    if (dto.seoOgTitle !== undefined) library.seo_og_title = dto.seoOgTitle;
    if (dto.seoOgDescription !== undefined) library.seo_og_description = dto.seoOgDescription;
    if (dto.seoOgType !== undefined) library.seo_og_type = dto.seoOgType ?? 'profile';
    if (dto.seoPrefix !== undefined) library.seo_prefix = dto.seoPrefix;
    if (dto.seoSuffix !== undefined) library.seo_suffix = dto.seoSuffix;

    return this.libraryRepo.save(library);
  }

  async getAnalytics(ownerUserId: string): Promise<LibraryAnalyticsResponseDto> {
    const library = await this.findLibraryByOwner(ownerUserId);
    if (!library) throw new NotFoundException('User belum punya Library');

    const [statsRows, activityRows, topBookRows, dailyRows, topicRows] = await Promise.all([
      this.dataSource.query(
        `SELECT
           COUNT(*)::int AS "totalBooks",
           COUNT(*) FILTER (WHERE published_at IS NOT NULL)::int AS "publishedBooks",
           COALESCE(SUM(view_count), 0)::int AS "totalViews",
           COALESCE(SUM(like_count), 0)::int AS "totalLikes",
           COALESCE(AVG(rating_average) FILTER (WHERE rating_count > 0), 0)::numeric(3, 2) AS "averageRating"
         FROM books
         WHERE library_id = $1`,
        [library.id],
      ),
      this.dataSource.query(
        `SELECT * FROM (
           SELECT b.judul AS title, 'Book dipublish' AS detail, b.published_at AS "activityAt", 'Published' AS type
           FROM books b WHERE b.library_id = $1 AND b.published_at IS NOT NULL
           UNION ALL
           SELECT b.judul AS title, 'Progress membaca diperbarui' AS detail, rp.updated_at AS "activityAt", 'Reading' AS type
           FROM reading_progress rp JOIN books b ON b.id = rp.book_id WHERE b.library_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Rating book diperbarui' AS detail, br.updated_at AS "activityAt", 'Rating' AS type
           FROM book_ratings br JOIN books b ON b.id = br.book_id WHERE b.library_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Chapter mendapat like' AS detail, cl.created_at AS "activityAt", 'Like' AS type
           FROM chapter_likes cl JOIN chapters c ON c.id = cl.chapter_id JOIN books b ON b.id = c.book_id WHERE b.library_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Highlight baru dibuat' AS detail, ch.created_at AS "activityAt", 'Highlight' AS type
           FROM chapter_highlights ch JOIN chapters c ON c.id = ch.chapter_id JOIN books b ON b.id = c.book_id WHERE b.library_id = $1
         ) activities ORDER BY "activityAt" DESC LIMIT 6`,
        [library.id],
      ),
      this.dataSource.query(
        `SELECT id AS "bookId", judul AS title, COALESCE(view_count, 0)::int AS views, (published_at IS NOT NULL) AS published
         FROM books
         WHERE library_id = $1
         ORDER BY view_count DESC, updated_at DESC
         LIMIT 5`,
        [library.id],
      ),
      this.dataSource.query(
        `WITH days AS (
           SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
         ), reading AS (
           SELECT DATE(rp.updated_at) AS day,
             COUNT(DISTINCT rp.user_id)::int AS readers,
             COUNT(*)::int AS reading_sessions
           FROM reading_progress rp
           JOIN books b ON b.id = rp.book_id
           WHERE b.library_id = $1 AND rp.updated_at >= CURRENT_DATE - INTERVAL '6 days'
           GROUP BY DATE(rp.updated_at)
         ), daily AS (
           SELECT d.day, COALESCE(r.readers, 0)::int AS readers,
             COALESCE(r.reading_sessions, 0)::int AS reading_sessions
           FROM days d LEFT JOIN reading r ON r.day = d.day
         ), with_previous AS (
           SELECT *, LAG(readers) OVER (ORDER BY day) AS previous_readers,
             LAG(reading_sessions) OVER (ORDER BY day) AS previous_reading_sessions
           FROM daily
         )
         SELECT day::text AS date, 0::int AS views, readers, reading_sessions AS "readingSessions",
           ROUND(CASE WHEN COALESCE(previous_readers, 0) = 0 THEN 0 ELSE ((readers - previous_readers)::numeric / previous_readers) * 100 END, 1)::float AS "readerGrowth",
           ROUND(CASE WHEN COALESCE(previous_reading_sessions, 0) = 0 THEN 0 ELSE ((reading_sessions - previous_reading_sessions)::numeric / previous_reading_sessions) * 100 END, 1)::float AS "readingGrowth"
         FROM with_previous ORDER BY day`,
        [library.id],
      ),
      this.dataSource.query(
        `SELECT DISTINCT c.chat_topic_id AS "topicId"
         FROM chapters c JOIN books b ON b.id = c.book_id
         WHERE b.library_id = $1 AND c.chat_topic_id IS NOT NULL`,
        [library.id],
      ),
    ]);

    const totalComments = await Promise.all(
      (topicRows as Array<{ topicId: string }>).filter((row) => row.topicId).map((row) => this.chatService.getCommentCountForTopic(row.topicId)),
    ).then((counts) => counts.reduce((sum, count) => sum + count, 0));
    const totalReadersRows = await this.dataSource.query(
      `SELECT COUNT(DISTINCT rp.user_id)::int AS total
       FROM reading_progress rp JOIN books b ON b.id = rp.book_id WHERE b.library_id = $1`,
      [library.id],
    );

    return {
      totalBooks: Number(statsRows[0]?.totalBooks ?? 0),
      publishedBooks: Number(statsRows[0]?.publishedBooks ?? 0),
      totalReaders: Number(totalReadersRows[0]?.total ?? 0),
      totalViews: Number(statsRows[0]?.totalViews ?? 0),
      totalLikes: Number(statsRows[0]?.totalLikes ?? 0),
      totalComments,
      averageRating: Number(statsRows[0]?.averageRating ?? 0),
      topBooks: topBookRows.map((row: { bookId: string; title: string; views: number | string; published: boolean }) => ({
        bookId: row.bookId,
        title: row.title,
        views: Number(row.views),
        published: row.published,
      })),
      daily: dailyRows.map((row: { date: string; views: number | string; readers: number | string; readingSessions: number | string; readerGrowth: number | string; readingGrowth: number | string }) => ({
        date: row.date,
        views: Number(row.views),
        readers: Number(row.readers),
        readingSessions: Number(row.readingSessions),
        readerGrowth: Number(row.readerGrowth),
        readingGrowth: Number(row.readingGrowth),
      })),
      recentActivities: activityRows.map((row: { title: string; detail: string; activityAt: Date | string; type: string }) => ({
        title: row.title,
        detail: row.detail,
        activityAt: row.activityAt,
        type: row.type,
      })),
    };
  }

  toResponseDto(library: Library): LibraryResponseDto {
    return {
      id: library.id,
      platformId: library.platform_id,
      ownerUserId: library.owner_user_id,
      nama: library.nama,
      slug: library.slug,
      deskripsi: library.deskripsi,
      coverUrl: library.cover_url,
      seoTitle: library.seo_title,
      seoDescription: library.seo_description,
      seoH1: library.seo_h1,
      seoOgTitle: library.seo_og_title,
      seoOgDescription: library.seo_og_description,
      seoOgType: library.seo_og_type,
      seoPrefix: library.seo_prefix,
      seoSuffix: library.seo_suffix,
      createdAt: library.created_at,
      updatedAt: library.updated_at,
    };
  }
}
