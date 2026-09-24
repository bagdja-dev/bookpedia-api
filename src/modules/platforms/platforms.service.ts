import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { ChatServiceClient } from '../../common/chat-service/chat-service.client';
import { Genre } from '../../entities/genre.entity';
import { CatalogSectionConfig, Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { PlatformUserActivityResponseDto } from './dto/platform-user-activity.dto';
import { PlatformUserReadingResponseDto } from './dto/platform-user-reading.dto';
import { PlatformAnalyticsResponseDto } from './dto/platform-analytics.dto';

/**
 * Genre default yang di-copy ke Platform baru (§4.1, 10 Sep 2026) — sama
 * persis 11 genre seed awal MVP (lihat
 * supabase/migrations/20260908030000_genres.sql). Tanpa auto-seed ini,
 * Platform baru lahir dengan 0 genre (dropdown Book kosong) karena genre
 * sekarang di-scope per-Platform, bukan global lagi — gap yang ditemukan
 * saat desain Fase 4, belum disebut eksplisit di execution-plan.md.
 */
const DEFAULT_GENRES: ReadonlyArray<{ nama: string; slug: string }> = [
  { nama: 'Aksi', slug: 'aksi' },
  { nama: 'Drama', slug: 'drama' },
  { nama: 'Fantasi', slug: 'fantasi' },
  { nama: 'Fiksi Ilmiah', slug: 'fiksi-ilmiah' },
  { nama: 'Horor', slug: 'horor' },
  { nama: 'Komedi', slug: 'komedi' },
  { nama: 'Misteri', slug: 'misteri' },
  { nama: 'Non-Fiksi', slug: 'non-fiksi' },
  { nama: 'Romance', slug: 'romance' },
  { nama: 'Slice of Life', slug: 'slice-of-life' },
  { nama: 'Thriller', slug: 'thriller' },
];

function defaultHomepageSections(): CatalogSectionConfig[] {
  return [
    { key: 'top', type: 'top', title: 'Top / Hot', enabled: true, layout: 'slider', limit: 10 },
    { key: 'new-updated', type: 'new_updated', title: 'New Updated', enabled: true, layout: 'slider', limit: 10 },
  ];
}

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(PlatformStaff)
    private readonly platformStaffRepo: Repository<PlatformStaff>,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatServiceClient,
  ) {}

  /**
   * Owner (org tunggal pemilik client_app Bookpedia) lihat SEMUA Platform,
   * org-wide. Staff cuma lihat Platform yang dia punya row aktif di
   * `platform_staff`. Dipanggil controller dengan `isOwner` dari
   * `request.platformAccess` (di-set PlatformAccessGuard).
   */
  async findMine(userId: string, isOwner: boolean): Promise<Platform[]> {
    if (isOwner) {
      return this.platformRepo.find({ order: { created_at: 'ASC' } });
    }

    const staffRows = await this.platformStaffRepo.find({ where: { user_id: userId, is_active: true } });
    const platformIds = staffRows.map((row) => row.platform_id);
    if (platformIds.length === 0) return [];

    return this.platformRepo.find({ where: { id: In(platformIds) }, order: { created_at: 'ASC' } });
  }

  async findById(id: string): Promise<Platform | null> {
    return this.platformRepo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Platform | null> {
    return this.platformRepo.findOne({ where: { slug } });
  }

  async listUserActivity(
    platformId: string,
    page: number,
    limit: number,
    search: string,
  ): Promise<PlatformUserActivityResponseDto> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [platformId];
    const searchClause = search
      ? `WHERE (u.display_name ILIKE $2 OR u.username ILIKE $2 OR u.email ILIKE $2 OR u.external_user_id::text ILIKE $2)`
      : '';
    if (search) params.push(`%${search}%`);

    const activityCte = `
      WITH activity AS (
        SELECT l.owner_user_id AS user_id, l.updated_at AS activity_at, 'library' AS activity_type
        FROM libraries l WHERE l.platform_id = $1
        UNION ALL
        SELECT rp.user_id, rp.updated_at, 'reading'
        FROM reading_progress rp JOIN books b ON b.id = rp.book_id
        WHERE b.platform_id = $1
        UNION ALL
        SELECT br.user_id, br.updated_at, 'rating'
        FROM book_ratings br JOIN books b ON b.id = br.book_id
        WHERE b.platform_id = $1
        UNION ALL
        SELECT cl.user_id, cl.created_at, 'like'
        FROM chapter_likes cl JOIN chapters c ON c.id = cl.chapter_id JOIN books b ON b.id = c.book_id
        WHERE b.platform_id = $1
        UNION ALL
        SELECT ch.user_id, ch.created_at, 'highlight'
        FROM chapter_highlights ch JOIN chapters c ON c.id = ch.chapter_id JOIN books b ON b.id = c.book_id
        WHERE b.platform_id = $1
      ), grouped AS (
        SELECT
          user_id,
          MAX(activity_at) AS last_activity_at,
          COUNT(*) FILTER (WHERE activity_type = 'reading')::int AS reading_count,
          COUNT(*) FILTER (WHERE activity_type = 'rating')::int AS rating_count,
          COUNT(*) FILTER (WHERE activity_type = 'like')::int AS like_count,
          COUNT(*) FILTER (WHERE activity_type = 'highlight')::int AS highlight_count,
          COUNT(*) FILTER (WHERE activity_type = 'library')::int AS library_count
        FROM activity
        GROUP BY user_id
      )
    `;

    const [rows, totalRows] = await Promise.all([
      this.dataSource.query(
        `${activityCte}
         SELECT g.user_id AS "userId", u.email, u.username, u.display_name AS "displayName",
           u.avatar_url AS "avatarUrl", g.reading_count AS "readingCount", g.rating_count AS "ratingCount",
           g.like_count AS "likeCount", g.highlight_count AS "highlightCount", g.library_count AS "libraryCount",
           g.last_activity_at AS "lastActivityAt"
         FROM grouped g LEFT JOIN users u ON u.external_user_id = g.user_id
         ${searchClause}
         ORDER BY g.last_activity_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `${activityCte}
         SELECT COUNT(*)::int AS total FROM grouped g LEFT JOIN users u ON u.external_user_id = g.user_id ${searchClause}`,
        params,
      ),
    ]);

    return {
      items: rows,
      total: Number(totalRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async getAnalytics(platformId: string, days: number): Promise<PlatformAnalyticsResponseDto> {
    const [rows, statsRows, recentActivityRows, commentTopicRows, topBookRows] = await Promise.all([
      this.dataSource.query(
      `WITH activity AS (
         SELECT l.owner_user_id AS user_id, l.updated_at AS activity_at, 'library' AS activity_type
         FROM libraries l
         WHERE l.platform_id = $1
         UNION ALL
         SELECT rp.user_id, rp.updated_at, 'reading'
         FROM reading_progress rp
         JOIN books b ON b.id = rp.book_id
         WHERE b.platform_id = $1
         UNION ALL
         SELECT br.user_id, br.updated_at, 'rating'
         FROM book_ratings br
         JOIN books b ON b.id = br.book_id
         WHERE b.platform_id = $1
         UNION ALL
         SELECT cl.user_id, cl.created_at, 'like'
         FROM chapter_likes cl
         JOIN chapters c ON c.id = cl.chapter_id
         JOIN books b ON b.id = c.book_id
         WHERE b.platform_id = $1
         UNION ALL
         SELECT ch.user_id, ch.created_at, 'highlight'
         FROM chapter_highlights ch
         JOIN chapters c ON c.id = ch.chapter_id
         JOIN books b ON b.id = c.book_id
         WHERE b.platform_id = $1
       ), days AS (
         SELECT generate_series(
           CURRENT_DATE - (($2::int - 1) * INTERVAL '1 day'),
           CURRENT_DATE,
           INTERVAL '1 day'
         )::date AS day
       ), daily AS (
         SELECT
           d.day,
           (
             SELECT COUNT(DISTINCT a.user_id)::int
             FROM activity a
             WHERE a.activity_at < d.day + INTERVAL '1 day'
           ) AS total_users,
           COUNT(a.user_id) FILTER (WHERE a.activity_type = 'reading')::int AS reading_events
         FROM days d
         LEFT JOIN activity a ON a.activity_at >= d.day AND a.activity_at < d.day + INTERVAL '1 day'
         GROUP BY d.day
       ), with_previous AS (
         SELECT
           day,
           total_users,
           reading_events,
           LAG(total_users) OVER (ORDER BY day) AS previous_total_users,
           LAG(reading_events) OVER (ORDER BY day) AS previous_reading_events
         FROM daily
       )
       SELECT
         day::text AS date,
         ROUND(
           CASE
             WHEN COALESCE(previous_total_users, 0) = 0 THEN 0
             ELSE ((total_users - previous_total_users)::numeric / previous_total_users) * 100
           END,
           1
         )::float AS "userGrowth",
         ROUND(
           CASE
             WHEN COALESCE(previous_reading_events, 0) = 0 THEN 0
             ELSE ((reading_events - previous_reading_events)::numeric / previous_reading_events) * 100
           END,
           1
         )::float AS "readingGrowth",
         total_users AS "totalUsers"
       FROM with_previous
       ORDER BY day`,
        [platformId, days],
      ),
      this.dataSource.query(
        `WITH activity AS (
           SELECT l.owner_user_id AS user_id
           FROM libraries l
           WHERE l.platform_id = $1
           UNION ALL
           SELECT rp.user_id
           FROM reading_progress rp
           JOIN books b ON b.id = rp.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT br.user_id
           FROM book_ratings br
           JOIN books b ON b.id = br.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT cl.user_id
           FROM chapter_likes cl
           JOIN chapters c ON c.id = cl.chapter_id
           JOIN books b ON b.id = c.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT ch.user_id
           FROM chapter_highlights ch
           JOIN chapters c ON c.id = ch.chapter_id
           JOIN books b ON b.id = c.book_id
           WHERE b.platform_id = $1
         )
         SELECT
           (SELECT COUNT(*)::int FROM books WHERE platform_id = $1) AS "totalBooks",
           (SELECT COUNT(*)::int FROM libraries WHERE platform_id = $1) AS "totalLibraries",
           (SELECT COUNT(*)::int
            FROM books book
            WHERE book.platform_id = $1
              AND book.published_at IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM chapters chapter
                WHERE chapter.book_id = book.id AND chapter.status = 'published'
              )) AS "publishedBooks",
           (SELECT COUNT(DISTINCT user_id)::int FROM activity) AS "totalReaders",
           (SELECT COALESCE(SUM(view_count), 0)::int FROM books WHERE platform_id = $1) AS "totalViews",
           (SELECT COALESCE(SUM(like_count), 0)::int FROM books WHERE platform_id = $1) AS "totalLikes",
           (SELECT COALESCE(AVG(rating), 0)::numeric(3, 2) FROM book_ratings rating_row
            JOIN books rated_book ON rated_book.id = rating_row.book_id
            WHERE rated_book.platform_id = $1) AS "averageRating"`,
        [platformId],
      ),
      this.dataSource.query(
        `SELECT
           activities.title,
           activities.detail,
           activities."activityAt",
           activities.type,
           COALESCE(u.display_name, u.username, u.email, 'User') AS "userName",
           u.avatar_url AS "avatarUrl"
         FROM (
           SELECT b.judul AS title, 'Book dipublish' AS detail, b.published_at AS "activityAt", 'Published' AS type, l.owner_user_id AS user_id
           FROM books b
           JOIN libraries l ON l.id = b.library_id
           WHERE b.platform_id = $1 AND b.published_at IS NOT NULL
           UNION ALL
           SELECT b.judul AS title, 'Progress membaca diperbarui' AS detail, rp.updated_at AS "activityAt", 'Reading' AS type, rp.user_id
           FROM reading_progress rp
           JOIN books b ON b.id = rp.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Rating book diperbarui' AS detail, br.updated_at AS "activityAt", 'Rating' AS type, br.user_id
           FROM book_ratings br
           JOIN books b ON b.id = br.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Chapter mendapat like' AS detail, cl.created_at AS "activityAt", 'Like' AS type, cl.user_id
           FROM chapter_likes cl
           JOIN chapters c ON c.id = cl.chapter_id
           JOIN books b ON b.id = c.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT b.judul AS title, 'Highlight baru dibuat' AS detail, ch.created_at AS "activityAt", 'Highlight' AS type, ch.user_id
           FROM chapter_highlights ch
           JOIN chapters c ON c.id = ch.chapter_id
           JOIN books b ON b.id = c.book_id
           WHERE b.platform_id = $1
           UNION ALL
           SELECT l.nama AS title, 'Library memperbarui profil' AS detail, l.updated_at AS "activityAt", 'Updated' AS type, l.owner_user_id AS user_id
           FROM libraries l
           WHERE l.platform_id = $1
         ) activities
         LEFT JOIN users u ON u.external_user_id = activities.user_id
         ORDER BY "activityAt" DESC
         LIMIT 6`,
        [platformId],
      ),
      this.dataSource.query(
        `SELECT DISTINCT c.chat_topic_id AS "topicId"
         FROM chapters c
         JOIN books b ON b.id = c.book_id
         WHERE b.platform_id = $1 AND c.chat_topic_id IS NOT NULL`,
        [platformId],
      ),
      this.dataSource.query(
        `SELECT
           b.judul AS title,
           COALESCE(l.nama, 'Tanpa library') AS author,
           b.view_count::int AS views,
           CASE
             WHEN MAX(b.view_count) OVER () = 0 THEN 0
             ELSE ROUND((b.view_count::numeric / MAX(b.view_count) OVER ()) * 100)::int
           END AS progress
         FROM books b
         LEFT JOIN libraries l ON l.id = b.library_id
         WHERE b.platform_id = $1
         ORDER BY b.view_count DESC, b.updated_at DESC
         LIMIT 3`,
        [platformId],
      ),
    ]);

    const totalComments = await Promise.all(
      (commentTopicRows as Array<{ topicId: string | null }>)
        .filter((row): row is { topicId: string } => typeof row.topicId === 'string' && row.topicId.length > 0)
        .map((row) => this.chatService.getCommentCountForTopic(row.topicId)),
    ).then((counts) => counts.reduce((sum, count) => sum + count, 0));

    return {
      items: rows.map((row: { date: string; userGrowth: number | string; readingGrowth: number | string; totalUsers: number | string }) => ({
        date: row.date,
        userGrowth: Number(row.userGrowth),
        readingGrowth: Number(row.readingGrowth),
        totalUsers: Number(row.totalUsers),
      })),
      topBooks: topBookRows.map((row: { title: string; author: string; views: number | string; progress: number | string }) => ({
        title: row.title,
        author: row.author,
        views: Number(row.views),
        progress: Number(row.progress),
      })),
      recentActivities: recentActivityRows.map((row: { title: string; detail: string; activityAt: Date | string; type: string; userName: string; avatarUrl: string | null }) => ({
        title: row.title,
        detail: row.detail,
        activityAt: row.activityAt,
        type: row.type,
        userName: row.userName,
        avatarUrl: row.avatarUrl,
      })),
      totalBooks: Number(statsRows[0]?.totalBooks ?? 0),
      totalLibraries: Number(statsRows[0]?.totalLibraries ?? 0),
      publishedBooks: Number(statsRows[0]?.publishedBooks ?? 0),
      totalReaders: Number(statsRows[0]?.totalReaders ?? 0),
      totalViews: Number(statsRows[0]?.totalViews ?? 0),
      totalComments,
      totalLikes: Number(statsRows[0]?.totalLikes ?? 0),
      averageRating: Number(statsRows[0]?.averageRating ?? 0),
    };
  }

  async getUserReading(platformId: string, userId: string): Promise<PlatformUserReadingResponseDto> {
    const rows = await this.dataSource.query(
      `SELECT
         rp.user_id AS "userId",
         u.email,
         u.username,
         u.display_name AS "displayName",
         u.avatar_url AS "avatarUrl",
         b.id AS "bookId",
         b.slug AS "bookSlug",
         b.judul AS "bookTitle",
         b.cover_url AS "bookCoverUrl",
         c.id AS "lastChapterId",
         c.order_index AS "lastChapterOrderIndex",
         c.judul AS "lastChapterTitle",
         rp.updated_at AS "lastReadAt"
       FROM reading_progress rp
       JOIN books b ON b.id = rp.book_id AND b.platform_id = $1
       JOIN chapters c ON c.id = rp.last_chapter_id
       LEFT JOIN users u ON u.external_user_id = rp.user_id
       WHERE rp.user_id = $2
       ORDER BY rp.updated_at DESC`,
      [platformId, userId],
    );

    return {
      userId,
      email: rows[0]?.email ?? null,
      username: rows[0]?.username ?? null,
      displayName: rows[0]?.displayName ?? null,
      avatarUrl: rows[0]?.avatarUrl ?? null,
      readingList: rows.map((row) => ({
        bookId: row.bookId,
        bookSlug: row.bookSlug,
        bookTitle: row.bookTitle,
        bookCoverUrl: row.bookCoverUrl ?? null,
        lastChapterId: row.lastChapterId,
        lastChapterOrderIndex: Number(row.lastChapterOrderIndex),
        lastChapterTitle: row.lastChapterTitle,
        lastReadAt: row.lastReadAt,
      })),
    };
  }

  /**
   * Dipakai resolusi custom domain publik (GET /public/platforms/resolve) —
   * cuma domain yang SUDAH lolos verifikasi DNS TXT (`domain_verified_at`
   * terisi) yang boleh di-resolve, persis pola `markets.resolveDomain()`.
   */
  async findByVerifiedDomain(domain: string): Promise<Platform | null> {
    const platform = await this.platformRepo.findOne({ where: { domain } });
    if (!platform || !platform.domain_verified_at) return null;
    return platform;
  }

  /**
   * Dipakai LibrariesService.create() untuk resolve+validasi `platformId`
   * dari client — 404 kalau tidak ada ATAU tidak aktif (Platform nonaktif
   * tidak boleh menerima Library baru).
   */
  async getActivePlatformOrThrow(id: string): Promise<Platform> {
    const platform = await this.findById(id);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
  }

  /**
   * Varian by-slug dari `getActivePlatformOrThrow()` — dipakai
   * `LibrariesService.create()` (§4.2, 11 Sep 2026, koreksi desain): client
   * (browser, belum tentu Owner/Staff platform manapun) tidak pernah punya
   * akses ke UUID Platform (endpoint publik sengaja tidak expose `id`), jadi
   * `POST /libraries` menerima `platformSlug`, bukan `platformId`.
   */
  async getActivePlatformBySlugOrThrow(slug: string): Promise<Platform> {
    const platform = await this.findBySlug(slug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
  }

  /**
   * Buat Platform baru + auto-seed genre default dalam SATU transaction
   * (lihat DEFAULT_GENRES di atas) — pola transaction sama seperti
   * ChaptersService.reorder().
   */
  async create(dto: CreatePlatformDto): Promise<Platform> {
    const existingSlug = await this.platformRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A platform with this slug already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const platformRepo = manager.getRepository(Platform);
      const genreRepo = manager.getRepository(Genre);

      const platform = platformRepo.create({
        nama: dto.nama,
        slug: dto.slug,
        logo_url: dto.logoUrl ?? null,
        favicon_url: dto.faviconUrl ?? null,
        notification_sound_url: dto.notificationSoundUrl ?? null,
        colors: dto.colors,
        lock_studio: dto.lockStudio ?? false,
        studio_edit_mode: dto.studioEditMode ?? 'auto',
        renderer_key: dto.rendererKey ?? 'reader',
        homepage_sections: dto.homepageSections ?? defaultHomepageSections(),
        max_free_chapters: dto.maxFreeChapters ?? 0,
        show_book_status: dto.showBookStatus ?? true,
        max_tags_per_book: dto.maxTagsPerBook ?? 5,
        enable_rating: dto.enableRating ?? true,
        rating_mode: dto.ratingMode ?? 'book',
        enable_like: dto.enableLike ?? true,
        enable_comment: dto.enableComment ?? true,
        enable_share: dto.enableShare ?? true,
        seo_default_h1: dto.seoDefaultH1 ?? null,
        seo_default_title: dto.seoDefaultTitle ?? null,
        seo_default_description: dto.seoDefaultDescription ?? null,
        seo_default_og_title: dto.seoDefaultOgTitle ?? null,
        seo_default_og_description: dto.seoDefaultOgDescription ?? null,
        seo_default_og_type: dto.seoDefaultOgType ?? 'website',
        seo_prefix: dto.seoPrefix ?? null,
        seo_suffix: dto.seoSuffix ?? null,
      });
      const saved = await platformRepo.save(platform);

      const genres = DEFAULT_GENRES.map((g) =>
        genreRepo.create({ platform_id: saved.id, nama: g.nama, slug: g.slug }),
      );
      await genreRepo.save(genres);

      return saved;
    });
  }

  async update(id: string, dto: UpdatePlatformDto): Promise<Platform> {
    const platform = await this.findById(id);
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    if (dto.nama !== undefined) platform.nama = dto.nama;
    if (dto.slug !== undefined && dto.slug !== platform.slug) {
      const existingSlug = await this.platformRepo.findOne({ where: { slug: dto.slug } });
      if (existingSlug) {
        throw new ConflictException('A platform with this slug already exists');
      }
      platform.slug = dto.slug;
    }
    if (dto.logoUrl !== undefined) platform.logo_url = dto.logoUrl;
    if (dto.faviconUrl !== undefined) platform.favicon_url = dto.faviconUrl;
    if (dto.notificationSoundUrl !== undefined) platform.notification_sound_url = dto.notificationSoundUrl;
    if (dto.colors !== undefined) platform.colors = dto.colors;
    if (dto.lockStudio !== undefined) platform.lock_studio = dto.lockStudio;
    if (dto.studioEditMode !== undefined) platform.studio_edit_mode = dto.studioEditMode;
    if (dto.rendererKey !== undefined) platform.renderer_key = dto.rendererKey;
    if (dto.homepageSections !== undefined) platform.homepage_sections = dto.homepageSections;
    if (dto.isActive !== undefined) platform.is_active = dto.isActive;
    if (dto.domain !== undefined && dto.domain !== platform.domain) {
      const existingDomain = await this.platformRepo.findOne({ where: { domain: dto.domain } });
      if (existingDomain) {
        throw new ConflictException('A platform with this domain already exists');
      }
      platform.domain = dto.domain;
    }
    if (dto.maxFreeChapters !== undefined) platform.max_free_chapters = dto.maxFreeChapters;
    if (dto.showBookStatus !== undefined) platform.show_book_status = dto.showBookStatus;
    if (dto.maxTagsPerBook !== undefined) platform.max_tags_per_book = dto.maxTagsPerBook;
    if (dto.searchConsoleVerificationFilename !== undefined) {
      platform.search_console_verification_filename = dto.searchConsoleVerificationFilename;
    }
    if (dto.searchConsoleVerificationContent !== undefined) {
      platform.search_console_verification_content = dto.searchConsoleVerificationContent;
    }
    if (dto.enableRating !== undefined) platform.enable_rating = dto.enableRating;
    if (dto.ratingMode !== undefined) platform.rating_mode = dto.ratingMode;
    if (dto.enableLike !== undefined) platform.enable_like = dto.enableLike;
    if (dto.enableComment !== undefined) platform.enable_comment = dto.enableComment;
    if (dto.enableShare !== undefined) platform.enable_share = dto.enableShare;
    if (dto.seoDefaultH1 !== undefined) platform.seo_default_h1 = dto.seoDefaultH1;
    if (dto.seoDefaultTitle !== undefined) platform.seo_default_title = dto.seoDefaultTitle;
    if (dto.seoDefaultDescription !== undefined) platform.seo_default_description = dto.seoDefaultDescription;
    if (dto.seoDefaultOgTitle !== undefined) platform.seo_default_og_title = dto.seoDefaultOgTitle;
    if (dto.seoDefaultOgDescription !== undefined) platform.seo_default_og_description = dto.seoDefaultOgDescription;
    if (dto.seoDefaultOgType !== undefined) platform.seo_default_og_type = dto.seoDefaultOgType ?? 'website';
    if (dto.seoPrefix !== undefined) platform.seo_prefix = dto.seoPrefix;
    if (dto.seoSuffix !== undefined) platform.seo_suffix = dto.seoSuffix;

    return this.platformRepo.save(platform);
  }

  toResponseDto(platform: Platform): PlatformResponseDto {
    return {
      id: platform.id,
      nama: platform.nama,
      slug: platform.slug,
      logoUrl: platform.logo_url,
      faviconUrl: platform.favicon_url,
      notificationSoundUrl: platform.notification_sound_url,
      colors: platform.colors,
      lockStudio: platform.lock_studio,
      studioEditMode: platform.studio_edit_mode,
      rendererKey: platform.renderer_key,
      homepageSections: platform.homepage_sections ?? defaultHomepageSections(),
      domain: platform.domain,
      domainVerifiedAt: platform.domain_verified_at,
      isActive: platform.is_active,
      createdAt: platform.created_at,
      updatedAt: platform.updated_at,
      maxFreeChapters: platform.max_free_chapters,
      showBookStatus: platform.show_book_status,
      maxTagsPerBook: platform.max_tags_per_book,
      searchConsoleVerificationFilename: platform.search_console_verification_filename,
      searchConsoleVerificationContent: platform.search_console_verification_content,
      enableRating: platform.enable_rating,
      ratingMode: platform.rating_mode,
      enableLike: platform.enable_like,
      enableComment: platform.enable_comment,
      enableShare: platform.enable_share,
      seoDefaultH1: platform.seo_default_h1,
      seoDefaultTitle: platform.seo_default_title,
      seoDefaultDescription: platform.seo_default_description,
      seoDefaultOgTitle: platform.seo_default_og_title,
      seoDefaultOgDescription: platform.seo_default_og_description,
      seoDefaultOgType: platform.seo_default_og_type,
      seoPrefix: platform.seo_prefix,
      seoSuffix: platform.seo_suffix,
    };
  }
}
