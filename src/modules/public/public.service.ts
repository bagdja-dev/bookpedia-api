import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { BookPromotion } from '../../entities/book-promotion.entity';
import { BookSeries } from '../../entities/book-series.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { CatalogSectionConfig, Platform } from '../../entities/platform.entity';
import { ReadingProgress } from '../../entities/reading-progress.entity';
import { Series } from '../../entities/series.entity';
import { PlatformsService } from '../platforms/platforms.service';
import { BookCatalogDto } from './dto/book-catalog.dto';
import { SimilarBooksResponseDto } from './dto/similar-books-response.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { CatalogHomeResponseDto } from './dto/catalog-home-response.dto';
import { LibraryProfileDto } from './dto/library-profile.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { ChapterDetailDto } from './dto/chapter-detail.dto';
import { PlatformResolveResponseDto } from './dto/platform-resolve-response.dto';
import { PlatformPublicProfileDto } from './dto/platform-public-profile.dto';
import { UserProfileStatsDto } from './dto/user-profile-stats.dto';
import { TagResponseDto } from '../tags/dto/tag-response.dto';
import { TagsService } from '../tags/tags.service';
import { SitemapEntriesDto } from './dto/sitemap-entries.dto';
import { isChapterFree } from '../../common/utils/free-chapters.util';
import { ChatServiceClient } from '../../common/chat-service/chat-service.client';
import { HAS_PUBLISHED_CHAPTER_SQL, IS_BOOK_PUBLISHED_SQL } from '../../common/book-visibility.sql';

/**
 * Fase 4 (§4.1, 10 Sep 2026): semua method di bawah sekarang butuh
 * `platformId` — resolusi Platform dilakukan sekali di
 * `resolvePlatformBySlugOrThrow()` (dipanggil PublicController dari path
 * param `:platformSlug`), lalu diteruskan ke tiap method di sini supaya
 * query Book/Library selalu ter-scope `WHERE platform_id = ...` — cegah
 * data "bocor" lintas Platform. Keputusan resolusi lewat path param
 * eksplisit (bukan Host header), lihat plan/bookpedia/execution-plan.md §4.1.
 */
@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    @InjectRepository(ReadingProgress)
    private readonly readingProgressRepo: Repository<ReadingProgress>,
    @InjectRepository(BookPromotion)
    private readonly promotionRepo: Repository<BookPromotion>,
    @InjectRepository(BookSeries)
    private readonly bookSeriesRepo: Repository<BookSeries>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    private readonly platformsService: PlatformsService,
    private readonly tagsService: TagsService,
    private readonly chatService: ChatServiceClient,
  ) {}

  async resolvePlatformBySlugOrThrow(platformSlug: string): Promise<Platform> {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
  }

  async getRealtimeWsToken(): Promise<{ access_token: string; expires_in: number; channels: string[] }> {
    return this.chatService.getRealtimeWsToken();
  }

  /**
   * Resolusi Platform dari custom domain (dipanggil middleware bookpedia-app,
   * analog `resolve-domain` di bagdja-auction-market) — subdomain wildcard
   * `{slug}.bookpedia.bagdja.com` di-parse langsung dari hostname di sisi
   * frontend, TIDAK lewat endpoint ini (cuma untuk domain custom yang sudah
   * lolos verifikasi DNS TXT).
   */
  async resolveByHost(host: string): Promise<PlatformResolveResponseDto> {
    const platform = await this.platformsService.findByVerifiedDomain(host);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Domain not found');
    }
    return { slug: platform.slug };
  }

  toPublicProfileDto(platform: Platform): PlatformPublicProfileDto {
    return {
      nama: platform.nama,
      slug: platform.slug,
      logoUrl: platform.logo_url,
      faviconUrl: platform.favicon_url,
      notificationSoundUrl: platform.notification_sound_url,
      colors: platform.colors,
      lockStudio: platform.lock_studio,
      studioEditMode: platform.studio_edit_mode,
      rendererKey: platform.renderer_key,
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

  /**
   * Katalog pusat lintas semua Library MILIK SATU PLATFORM — HANYA Book
   * dengan minimal 1 Chapter `published` (EXISTS subquery, bukan JOIN —
   * supaya tidak ada baris ganda per Book & tidak butuh DISTINCT). Library
   * nama/slug di-batch-fetch sekali per page (bukan N+1 per Book).
   *
   * §4.5 (11 Sep 2026): tambah filter `category` — Book kini punya
   * `category_id` sendiri (dipilih terpisah dari `genre_id` di form Book),
   * filter langsung `category.slug = ...` (join, pola sama filter `genre`).
   * Bisa dikombinasikan dengan `genre` (di-AND-kan).
   */
  async getCatalog(platformId: string, query: CatalogQueryDto): Promise<CatalogResponseDto> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL);

    const search = query.search?.trim();
    if (search) {
      const searchBy = query.searchBy ?? 'judul';
      if (searchBy === 'library') {
        // Nama Library tidak di-join di query builder ini (di-batch-fetch
        // terpisah di toCatalogDtos, lihat komentar method itu) — pakai
        // EXISTS subquery, konsisten pola HAS_PUBLISHED_CHAPTER_SQL di atas.
        qb.andWhere('EXISTS (SELECT 1 FROM libraries l WHERE l.id = book.library_id AND l.nama ILIKE :search)', {
          search: `%${search}%`,
        });
      } else if (searchBy === 'originalAuthor') {
        qb.andWhere('book.original_author ILIKE :search', { search: `%${search}%` });
      } else {
        qb.andWhere('book.judul ILIKE :search', { search: `%${search}%` });
      }
    }

    const genreSlug = query.genre?.trim();
    if (genreSlug) {
      qb.andWhere('genre.slug = :genreSlug', { genreSlug });
    }

    const categorySlug = query.category?.trim();
    if (categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    // `tag` boleh berisi lebih dari satu slug dipisah koma (dipakai tombol
    // "Cari Serupa" — filter Category+Genre+SEMUA Tag Book sekaligus,
    // 16 Sep 2026 susulan §12). Tiap tag jadi EXISTS terpisah, di-AND-kan —
    // Book harus punya SEMUA tag yang diminta (bukan salah satu/OR), supaya
    // makin banyak Tag diklik makin spesifik hasilnya. Klik 1 chip Tag biasa
    // (bukan tombol Cari Serupa) tetap kirim 1 slug saja, jalur yang sama.
    const tagSlugs = (query.tag ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    tagSlugs.forEach((tagSlug, i) => {
      const param = `tagSlug${i}`;
      qb.andWhere(
        `EXISTS (SELECT 1 FROM book_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.book_id = book.id AND t.slug = :${param})`,
        { [param]: tagSlug },
      );
    });

    qb.orderBy('book.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [books, total] = await qb.getManyAndCount();
    const items = await this.toCatalogDtos(books);

    return { items, total, page, limit };
  }

  /**
   * Dua grup slider "Cerita Serupa"/"Cerita Lainnya" di bagian bawah halaman
   * detail Book (SEO — internal linking antar halaman Book, bukan fitur
   * pembaca). Diacak (`ORDER BY RANDOM()`) SENGAJA, bukan `created_at DESC`
   * seperti `getCatalog` — daftar statis yang sama tiap render kurang
   * berguna untuk SEO (link equity numpuk ke Book yang sama terus).
   *
   * - `related`: genre/category sama ATAU berbagi minimal 1 Tag dengan Book
   *   ini. Bisa saja sedikit/kosong (Book tanpa genre/category/tag sama
   *   sekali) — itu wajar, TIDAK diisi filler lagi di sini.
   * - `others`: random murni dari Platform yang sama, EXCLUDE Book ini +
   *   EXCLUDE apa pun yang sudah masuk `related` (supaya 2 grup tidak
   *   tumpang tindih). Grup inilah yang menjamin section SEO ini tidak
   *   pernah benar-benar kosong selama Platform punya Book lain published.
   */
  async getSimilarBooks(platform: Platform, bookSlug: string, limit = 8): Promise<SimilarBooksResponseDto> {
    const target = await this.bookRepo.findOne({ where: { platform_id: platform.id, slug: bookSlug } });
    if (!target) {
      throw new NotFoundException('Book not found');
    }

    const take = Math.min(Math.max(limit, 1), 20);

    // Query builder ID-SAJA, TANPA join — `ORDER BY RANDOM()` + `.take()`
    // dibarengi `leftJoinAndSelect` membuat TypeORM diam-diam menambahkan
    // `SELECT DISTINCT` (heuristik standar TypeORM buat cegah row
    // terduplikasi kalau ada join), dan Postgres MENOLAK `SELECT DISTINCT`
    // yang `ORDER BY`-nya bukan ekspresi di select list — `RANDOM()` jelas
    // bukan. Hydrasi entity penuh (incl. genre/category) dilakukan
    // TERPISAH lewat `In(ids)` setelah urutan random-nya didapat, supaya
    // query yang butuh `ORDER BY RANDOM()` selalu bebas join/DISTINCT.
    const idsBaseQb = () =>
      this.bookRepo
        .createQueryBuilder('book')
        .select('book.id')
        .where('book.platform_id = :platformId', { platformId: platform.id })
        .andWhere('book.id != :targetId', { targetId: target.id })
        .andWhere(IS_BOOK_PUBLISHED_SQL)
        .andWhere(HAS_PUBLISHED_CHAPTER_SQL);

    // Kurasi manual penulis ("Rekomendasi Penulis") — prioritas TERTINGGI,
    // urut posisi yang diatur penulis (BUKAN random), TIDAK butuh fix di
    // atas (tidak ada `ORDER BY RANDOM()` di sini). Difilter ulang ke
    // syarat "discoverable" yang sama (defensive — kalau Book yang
    // dipromosikan belakangan di-unpublish, jangan ikut bocor ke publik).
    const promotions = await this.promotionRepo.find({ where: { book_id: target.id }, order: { position: 'ASC' } });
    let promoted: Book[] = [];
    if (promotions.length > 0) {
      const promotedIds = promotions.map((p) => p.promoted_book_id);
      const promotedBooks = await this.bookRepo.find({
        where: { id: In(promotedIds), platform_id: platform.id },
        relations: ['genre', 'category'],
      });
      const promotedById = new Map(promotedBooks.map((b) => [b.id, b]));
      promoted = promotedIds.map((id) => promotedById.get(id)).filter((b): b is Book => !!b);
    }

    const relatedConditions = ['book.id IN (SELECT bt.book_id FROM book_tags bt WHERE bt.tag_id IN (SELECT tag_id FROM book_tags WHERE book_id = :targetId))'];
    if (target.genre_id) relatedConditions.push('book.genre_id = :genreId');
    if (target.category_id) relatedConditions.push('book.category_id = :categoryId');

    const excludePromotedIds = promoted.map((b) => b.id);
    const relatedIdsQb = idsBaseQb().andWhere(`(${relatedConditions.join(' OR ')})`, {
      targetId: target.id,
      genreId: target.genre_id,
      categoryId: target.category_id,
    });
    if (excludePromotedIds.length > 0) {
      relatedIdsQb.andWhere('book.id NOT IN (:...excludePromotedIds)', { excludePromotedIds });
    }
    const relatedIds = (await relatedIdsQb.orderBy('RANDOM()').take(take).getMany()).map((b) => b.id);

    const excludeIds = [target.id, ...excludePromotedIds, ...relatedIds];
    const otherIds = (
      await idsBaseQb().andWhere('book.id NOT IN (:...excludeIds)', { excludeIds }).orderBy('RANDOM()').take(take).getMany()
    ).map((b) => b.id);

    const [related, others] = await Promise.all([this.hydrateBooksInOrder(relatedIds), this.hydrateBooksInOrder(otherIds)]);

    const [promotedDtos, relatedDtos, othersDtos] = await Promise.all([
      this.toCatalogDtos(promoted),
      this.toCatalogDtos(related),
      this.toCatalogDtos(others),
    ]);
    return { promoted: promotedDtos, related: relatedDtos, others: othersDtos };
  }

  /** Fetch entity penuh (+ genre/category) buat daftar ID, JAGA URUTAN sesuai `ids` — `In()` TtypeORM tidak menjamin urutan. */
  private async hydrateBooksInOrder(ids: string[]): Promise<Book[]> {
    if (ids.length === 0) return [];
    const books = await this.bookRepo.find({ where: { id: In(ids) }, relations: ['genre', 'category'] });
    const bookById = new Map(books.map((b) => [b.id, b]));
    return ids.map((id) => bookById.get(id)).filter((b): b is Book => !!b);
  }

  async getHomepage(platform: Platform): Promise<CatalogHomeResponseDto> {
    const sections = Array.isArray(platform.homepage_sections) ? platform.homepage_sections : [];
    const enabledSections = sections.filter((section) => section.enabled);
    const renderedSections = await Promise.all(
      enabledSections.map(async (section) => ({
        key: section.key,
        type: section.predefinedQuery ?? section.type,
        title: section.title,
        layout: section.layout,
        ...(await this.getHomepageSectionBooks(platform.id, section)),
      })),
    );

    return { sections: renderedSections };
  }

  private async getHomepageSectionBooks(
    platformId: string,
    section: CatalogSectionConfig,
  ): Promise<{ items: BookCatalogDto[]; page: number; pageSize: number; total: number; lazyLoad?: boolean }> {
    const pageSize = Math.min(Math.max(section.pageSize ?? section.limit ?? 10, 4), 50);
    const queryType = section.queryType ?? 'predefined';
    const predefinedQuery = section.predefinedQuery ?? section.type ?? 'new_updated';
    const hasExplicitSort = !!(section.customQuery?.sortRules?.length || section.customQuery?.sort);

    // "Top / Hot" bawaan (bukan custom query/sort override) — SKOR gabungan,
    // bukan sekadar `ORDER BY view_count DESC` (itu "all-time most viewed",
    // Book lama tidak pernah tergeser). Lihat `getHotBooks()`.
    if (queryType !== 'custom' && predefinedQuery === 'top' && !hasExplicitSort) {
      return this.getHotBooks(platformId, pageSize, section.lazyLoad);
    }

    // Homepage predefined query `new_updated` harus diurutkan berdasarkan
    // `books.updated_at` (buku yang paling baru diubah), BUKAN berdasarkan
    // chapter terakhir dipublish/update. Ini untuk daftar homepage, bukan
    // urutan series atau buku di dalam series.
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL);

    if (queryType === 'custom') {
      const customQuery = section.customQuery ?? {};
      const genres = Array.isArray(customQuery.genre) ? customQuery.genre : customQuery.genre ? [customQuery.genre] : [];
      const categories = Array.isArray(customQuery.category) ? customQuery.category : customQuery.category ? [customQuery.category] : [];
      if (genres.length > 0) qb.andWhere('genre.slug IN (:...sectionGenres)', { sectionGenres: genres });
      if (categories.length > 0) qb.andWhere('category.slug IN (:...sectionCategories)', { sectionCategories: categories });
      if (customQuery.library) {
        qb.andWhere('EXISTS (SELECT 1 FROM libraries section_library WHERE section_library.id = book.library_id AND section_library.slug = :sectionLibrary)', {
          sectionLibrary: customQuery.library,
        });
      }
      if (customQuery.search) qb.andWhere('book.judul ILIKE :sectionSearch', { sectionSearch: `%${customQuery.search}%` });
      if (customQuery.tag) {
        qb.andWhere('EXISTS (SELECT 1 FROM book_tags section_bt JOIN tags section_tag ON section_tag.id = section_bt.tag_id WHERE section_bt.book_id = book.id AND section_tag.slug = :sectionTag)', {
          sectionTag: customQuery.tag,
        });
      }
    }

    const legacySort = section.customQuery?.sort;
    const sortRules = section.customQuery?.sortRules?.length
      ? section.customQuery.sortRules
      : legacySort
        ? [{ field: legacySort, direction: legacySort === 'title' ? 'asc' : 'desc' }]
        : predefinedQuery === 'top'
          ? [{ field: 'views' as const, direction: 'desc' as const }]
          : [{ field: 'updated' as const, direction: 'desc' as const }];
    const sortColumns = {
      updated: 'book.updated_at',
      views: 'book.view_count',
      title: 'book.judul',
    } as const;

    if (queryType !== 'custom' && predefinedQuery === 'new_updated' && !hasExplicitSort) {
      // Homepage `new_updated` harus diurutkan dari chapter paling baru
      // yang sudah dipublish untuk tiap buku. Karena TypeORM tidak aman
      // mem-parsing raw subquery di ORDER BY, kita masukkan subquery sebagai
      // alias terpisah lalu order by alias itu.
      const latestPublishedChapterUpdatedAtSubquery = this.chapterRepo
        .createQueryBuilder('chapter')
        .select('MAX(chapter.updated_at)', 'latest_published_chapter_updated_at')
        .where('chapter.book_id = book.id')
        .andWhere("chapter.status = 'published'");

      qb.addSelect(`(${latestPublishedChapterUpdatedAtSubquery.getQuery()})`, 'latest_published_chapter_updated_at');
      qb.orderBy('latest_published_chapter_updated_at', 'DESC');
      qb.addOrderBy('book.id', 'ASC');
    } else {
      sortRules.forEach((rule, index) => {
        const column = sortColumns[rule.field];
        if (!column) return;
        if (index === 0) qb.orderBy(column, rule.direction.toUpperCase() as 'ASC' | 'DESC');
        else qb.addOrderBy(column, rule.direction.toUpperCase() as 'ASC' | 'DESC');
      });
      qb.addOrderBy('book.id', 'ASC');
    }

    const [books, total] = await qb.take(pageSize).skip(0).getManyAndCount();
    return { items: await this.toCatalogDtos(books), page: 1, pageSize, total, lazyLoad: section.lazyLoad };
  }

  /**
   * Skor "Hot" (24 Sep 2026, ganti `ORDER BY view_count DESC` yang cuma
   * "all-time most viewed" dan tidak pernah bisa disaingi Book baru):
   *
   *   score = (view_count × 1) + (like_count × 10) + (uniqueCommenterCount × 20)
   *
   * `view_count` tetap MENTAH (bukan unique visitor — lihat komentar
   * endpoint `POST .../chapters/:orderIndex/view`, belum ada skema
   * unique-view). `like_count` SUDAH otomatis unique-per-user (Like itu
   * toggle 1x per `(user_id, chapter_id)`). `uniqueCommenterCount` dihitung
   * `COUNT(DISTINCT senderUserId)` PER TOPIC lewat `bagdja-chat-service`
   * (`ChatServiceClient.getCommentStats`, batch — bukan N+1), lalu DIJUMLAH
   * lintas Chapter per Book — konsisten dengan cara `view_count`/`like_count`
   * Book sendiri juga SUM dari seluruh Chapter-nya (bukan di-dedupe lintas
   * Chapter kalau 1 user komentar di beberapa Chapter Book yang sama).
   *
   * Bobot (1/10/20) konstanta tetap, belum dibuat setting per-Platform —
   * lihat komentar bobot di bawah kalau perlu di-tuning nanti.
   *
   * Skala: fetch SEMUA Book eligible di Platform buat dihitung skornya
   * (bukan cuma `pageSize`), karena ranking butuh bandingkan SEMUA
   * kandidat dulu baru dipotong `pageSize` teratas. Wajar untuk skala
   * Platform saat ini; kalau katalog sudah sangat besar, pertimbangkan
   * skor pre-computed/cache alih-alih hitung ulang tiap request homepage.
   */
  private async getHotBooks(
    platformId: string,
    pageSize: number,
    lazyLoad?: boolean,
  ): Promise<{ items: BookCatalogDto[]; page: number; pageSize: number; total: number; lazyLoad?: boolean }> {
    const HOT_WEIGHTS = { view: 1, like: 10, uniqueCommenter: 20 };

    const eligibleBooks = await this.bookRepo
      .createQueryBuilder('book')
      .select(['book.id', 'book.view_count', 'book.like_count'])
      .where('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .getMany();

    const sortedBooksByScore = [...eligibleBooks].sort((a, b) => {
      const aScore = a.view_count + a.like_count * HOT_WEIGHTS.like;
      const bScore = b.view_count + b.like_count * HOT_WEIGHTS.like;
      return bScore - aScore;
    });

    const orderedIds = sortedBooksByScore.map((book) => book.id);
    const books = await this.bookRepo.find({ where: { id: In(orderedIds) }, relations: ['genre', 'category'] });
    const bookById = new Map(books.map((book) => [book.id, book]));
    const pageBooks = orderedIds.slice(0, pageSize).map((id) => bookById.get(id)).filter((book): book is Book => !!book);

    return { items: await this.toCatalogDtos(pageBooks), page: 1, pageSize, total: pageBooks.length, lazyLoad };
  }

  private async getCommentCountsForBooks(bookIds: string[]): Promise<Map<string, number>> {
    const countsByBook = new Map<string, number>();
    if (bookIds.length === 0) {
      return countsByBook;
    }

    const chapters = await this.chapterRepo.find({
      where: { book_id: In(bookIds), status: 'published' },
      select: ['id', 'book_id', 'chat_topic_id'],
    });

    const topicIds = [...new Set(chapters.filter((chapter) => chapter.chat_topic_id).map((chapter) => chapter.chat_topic_id!))];
    const topicCounts = new Map<string, number>();
    if (topicIds.length > 0) {
      const entries = await Promise.all(
        topicIds.map(async (topicId) => [topicId, await this.chatService.getCommentCountForTopic(topicId)] as const),
      );
      entries.forEach(([topicId, count]) => topicCounts.set(topicId, count));
    }

    for (const bookId of bookIds) {
      const total = chapters
        .filter((chapter) => chapter.book_id === bookId && chapter.chat_topic_id)
        .reduce((sum, chapter) => sum + (topicCounts.get(chapter.chat_topic_id!) ?? 0), 0);
      countsByBook.set(bookId, total);
    }

    return countsByBook;
  }

  /**
   * Susulan 17 Sep 2026 — komentar PER-CHAPTER (bukan agregat per-Book
   * seperti `getCommentCountsForBooks`) untuk statistik di daftar Chapter
   * halaman detail Book. Terima entity Chapter yang SUDAH di-fetch caller
   * (`getBookBySlug` sudah query semua Chapter published Book itu) supaya
   * tidak query ulang — cukup dedupe `chat_topic_id`, satu panggilan
   * `getCommentCountForTopic` per topic unik (biasanya = jumlah Chapter,
   * kecil, aman tanpa endpoint batch terpisah di chat-service).
   */
  private async getCommentCountsForChapters(
    chapters: { id: string; chat_topic_id: string | null }[],
  ): Promise<Map<string, number>> {
    const countsByChapter = new Map<string, number>();
    const topicIds = [...new Set(chapters.filter((chapter) => chapter.chat_topic_id).map((chapter) => chapter.chat_topic_id!))];
    const topicCounts = new Map<string, number>();
    if (topicIds.length > 0) {
      const entries = await Promise.all(
        topicIds.map(async (topicId) => [topicId, await this.chatService.getCommentCountForTopic(topicId)] as const),
      );
      entries.forEach(([topicId, count]) => topicCounts.set(topicId, count));
    }

    for (const chapter of chapters) {
      countsByChapter.set(chapter.id, chapter.chat_topic_id ? (topicCounts.get(chapter.chat_topic_id) ?? 0) : 0);
    }
    return countsByChapter;
  }

  /**
   * Agregat Library untuk halaman detail Book (susulan §"Author/Library
   * card", 16 Sep 2026) — total karya/views/comments SEMUA Book published
   * milik satu Library. HANYA dipanggil untuk satu Library per request
   * (`getBookBySlug`), jadi aman fetch entity Book penuh (id+viewCount)
   * lalu sum di memory — pola sama `getLibraryBySlug` yang sudah fetch
   * entity Book penuh untuk katalog Library, bukan query SUM terpisah.
   */
  private async getLibraryAggregateStats(
    libraryId: string,
  ): Promise<{ totalBooks: number; totalViews: number; totalComments: number }> {
    const books = await this.bookRepo
      .createQueryBuilder('book')
      .select(['book.id', 'book.view_count'])
      .where('book.library_id = :libraryId', { libraryId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .getMany();

    const commentCountsByBook = await this.getCommentCountsForBooks(books.map((book) => book.id));
    const totalComments = [...commentCountsByBook.values()].reduce((sum, count) => sum + count, 0);
    const totalViews = books.reduce((sum, book) => sum + book.view_count, 0);

    return { totalBooks: books.length, totalViews, totalComments };
  }

  /**
   * Statistik publik halaman Profile User (susulan 16 Sep 2026, murni
   * display — bookpedia/overview.md §15.3). `userId` TIDAK divalidasi ke
   * bagdja-auth (bukan tanggung jawab bookpedia-api) — kalau tidak
   * ditemukan/tidak pernah berinteraksi, kembalikan angka nol/array kosong,
   * BUKAN 404 (404 di sini cuma buat Platform yang tidak ditemukan, lihat
   * PublicController).
   */
  async getUserProfileStats(platformId: string, userId: string): Promise<UserProfileStatsDto> {
    const library = await this.libraryRepo.findOne({ where: { owner_user_id: userId, platform_id: platformId } });

    const [libraryStats, progressRows] = await Promise.all([
      library ? this.getLibraryAggregateStats(library.id) : Promise.resolve(null),
      this.readingProgressRepo.find({ where: { user_id: userId, is_public: true } }),
    ]);

    const bookIds = progressRows.map((row) => row.book_id);
    const books =
      bookIds.length > 0
        ? await this.bookRepo
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.genre', 'genre')
            .leftJoinAndSelect('book.category', 'category')
            .where('book.id IN (:...bookIds)', { bookIds })
            .andWhere('book.platform_id = :platformId', { platformId })
            .andWhere(IS_BOOK_PUBLISHED_SQL)
            .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
            .getMany()
        : [];

    return {
      worksCount: libraryStats?.totalBooks ?? 0,
      librarySlug: library?.slug ?? null,
      readingList: await this.toCatalogDtos(books),
    };
  }

  /** Batch-resolve Library nama/slug + Tag untuk sekumpulan Book — satu query IN per jenis, bukan per-baris. */
  private async toCatalogDtos(books: Book[]): Promise<BookCatalogDto[]> {
    if (books.length === 0) {
      return [];
    }

    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const [libraries, tagsByBook, commentCountsByBook, latestChapterByBook, seriesByBook, uniqueReaderCountsByBook] = await Promise.all([
      this.libraryRepo.find({ where: { id: In(libraryIds) } }),
      this.tagsService.findTagsForBooks(books.map((book) => book.id)),
      this.getCommentCountsForBooks(books.map((book) => book.id)),
      this.getLatestPublishedChapterTitles(books.map((book) => book.id)),
      this.getSeriesForBooks(books.map((book) => book.id)),
      this.getUniqueReaderCountsForBooks(books.map((book) => book.id)),
    ]);
    const libraryById = new Map(libraries.map((library) => [library.id, library]));

    return books.map((book) =>
      this.toCatalogDto(
        book,
        libraryById.get(book.library_id),
        (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t)),
        commentCountsByBook.get(book.id) ?? 0,
        latestChapterByBook.get(book.id) ?? null,
        seriesByBook.get(book.id) ?? null,
        uniqueReaderCountsByBook.get(book.id) ?? 0,
      ),
    );
  }

  private async getLatestPublishedChapterTitles(bookIds: string[]): Promise<Map<string, string>> {
    const chapters = await this.chapterRepo.find({
      where: bookIds.map((bookId) => ({ book_id: bookId, status: 'published' as const })),
      select: ['book_id', 'judul', 'order_index'],
      order: { order_index: 'DESC' },
    });
    const latestByBook = new Map<string, string>();
    for (const chapter of chapters) {
      if (!latestByBook.has(chapter.book_id)) latestByBook.set(chapter.book_id, chapter.judul);
    }
    return latestByBook;
  }

  private async getSeriesForBooks(bookIds: string[]): Promise<Map<string, { id: string; nama: string }>> {
    if (bookIds.length === 0) {
      return new Map();
    }

    const links = await this.bookSeriesRepo.find({
      where: { book_id: In(bookIds) },
      relations: ['series'],
      order: { position: 'ASC' },
    });

    const seriesByBook = new Map<string, { id: string; nama: string }>();
    for (const link of links) {
      if (seriesByBook.has(link.book_id) || !link.series) continue;
      seriesByBook.set(link.book_id, { id: link.series.id, nama: link.series.nama });
    }

    return seriesByBook;
  }

  private async getUniqueReaderCountsForBooks(bookIds: string[]): Promise<Map<string, number>> {
    if (bookIds.length === 0) {
      return new Map();
    }

    const rows = await this.readingProgressRepo
      .createQueryBuilder('reading_progress')
      .select('reading_progress.book_id', 'book_id')
      .addSelect('COUNT(DISTINCT reading_progress.user_id)', 'reader_count')
      .where('reading_progress.book_id IN (:...bookIds)', { bookIds })
      .groupBy('reading_progress.book_id')
      .getRawMany<{ book_id: string; reader_count: string }>();

    return new Map(rows.map((row) => [row.book_id, Number(row.reader_count ?? 0)]));
  }

  private toCatalogDto(
    book: Book,
    library: Library | undefined,
    tags: TagResponseDto[],
    commentCount: number,
    latestChapterTitle: string | null,
    series: { id: string; nama: string } | null,
    uniqueReaderCount: number,
  ): BookCatalogDto {
    return {
      id: book.id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre
        ? { id: book.genre.id, platformId: book.genre.platform_id, nama: book.genre.nama, slug: book.genre.slug }
        : null,
      category: book.category
        ? { id: book.category.id, platformId: book.category.platform_id, nama: book.category.nama, slug: book.category.slug }
        : null,
      tags,
      series,
      coverUrl: book.cover_url,
      status: book.status,
      latestChapterTitle,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      library: { nama: library?.nama ?? '', slug: library?.slug ?? '' },
      viewCount: book.view_count,
      ratingAverage: Number(book.rating_average),
      ratingCount: book.rating_count,
      likeCount: book.like_count,
      uniqueReaderCount,
      commentCount,
    };
  }

  /**
   * SEO Fase 2 (16 Sep 2026) — daftar Book+Library publik untuk `sitemap.xml`
   * (`bookpedia-app`). TANPA pagination (skala kecil, lihat seo-plan.md §3.4).
   * Chapter individual SENGAJA tidak disertakan (seo-plan.md §6.2).
   */
  async getSitemapEntries(platformId: string): Promise<SitemapEntriesDto> {
    const books = await this.bookRepo
      .createQueryBuilder('book')
      .where('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .orderBy('book.created_at', 'DESC')
      .getMany();

    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const bookIds = books.map((book) => book.id);
    const [libraries, chapters] = await Promise.all([
      libraryIds.length > 0 ? this.libraryRepo.find({ where: { id: In(libraryIds) } }) : Promise.resolve([]),
      bookIds.length > 0
        ? this.chapterRepo.find({
            where: { book_id: In(bookIds), status: 'published' },
            select: ['book_id', 'order_index', 'updated_at'],
          })
        : Promise.resolve([]),
    ]);
    const bookSlugById = new Map(books.map((book) => [book.id, book.slug]));

    return {
      books: books.map((book) => ({ slug: book.slug, updatedAt: book.updated_at })),
      libraries: libraries.map((library) => ({ slug: library.slug, updatedAt: library.updated_at })),
      chapters: chapters.map((chapter) => ({
        bookSlug: bookSlugById.get(chapter.book_id) ?? '',
        orderIndex: chapter.order_index,
        updatedAt: chapter.updated_at,
      })),
    };
  }

  /**
   * Profil publik Library by slug (di-scope ke satu Platform) — `books`
   * HANYA yang punya minimal 1 Chapter published (aturan sama seperti
   * katalog). 404 kalau slug tidak ditemukan di Platform ini.
   */
  async getLibraryBySlug(platformId: string, librarySlug: string): Promise<LibraryProfileDto> {
    const library = await this.libraryRepo.findOne({ where: { slug: librarySlug, platform_id: platformId } });
    if (!library) {
      throw new NotFoundException('Library not found');
    }

    const books = await this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.library_id = :libraryId', { libraryId: library.id })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .orderBy('book.created_at', 'DESC')
      .getMany();

    const [tagsByBook, commentCountsByBook, latestChapterByBook, seriesByBook, uniqueReaderCountsByBook] = await Promise.all([
      this.tagsService.findTagsForBooks(books.map((book) => book.id)),
      this.getCommentCountsForBooks(books.map((book) => book.id)),
      this.getLatestPublishedChapterTitles(books.map((book) => book.id)),
      this.getSeriesForBooks(books.map((book) => book.id)),
      this.getUniqueReaderCountsForBooks(books.map((book) => book.id)),
    ]);

    return {
      id: library.id,
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
      books: books.map((book) =>
        this.toCatalogDto(
          book,
          library,
          (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t)),
          commentCountsByBook.get(book.id) ?? 0,
          latestChapterByBook.get(book.id) ?? null,
          seriesByBook.get(book.id) ?? null,
          uniqueReaderCountsByBook.get(book.id) ?? 0,
        ),
      ),
    };
  }

  /**
   * Detail Book publik by slug (di-scope ke satu Platform) — 404 kalau slug
   * tidak ditemukan di Platform ini ATAU Book itu tidak punya Chapter
   * published sama sekali (tidak "discoverable" publik, meski row-nya ada
   * di DB). `chapters` HANYA yang published, urut order_index ASC.
   */
  async getSeriesById(platformId: string, seriesId: string): Promise<{ id: string; nama: string; books: BookCatalogDto[] }> {
    const series = await this.seriesRepo.findOne({
      where: { id: seriesId, platform_id: platformId },
    });
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const links = await this.bookSeriesRepo.find({
      where: { series_id: series.id },
      relations: ['book'],
      order: { position: 'ASC' },
    });

    const bookIds = links.map((link) => link.book_id);
    if (bookIds.length === 0) {
      return { id: series.id, nama: series.nama, books: [] };
    }

    const books = await this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.id IN (:...bookIds)', { bookIds })
      .andWhere('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .orderBy('book.created_at', 'DESC')
      .getMany();

    const bookMap = new Map(books.map((book) => [book.id, book]));
    const orderedBooks = bookIds.map((bookId) => bookMap.get(bookId)).filter((book): book is Book => !!book);
    const [tagsByBook, commentCountsByBook, latestChapterByBook, uniqueReaderCountsByBook] = await Promise.all([
      this.tagsService.findTagsForBooks(orderedBooks.map((book) => book.id)),
      this.getCommentCountsForBooks(orderedBooks.map((book) => book.id)),
      this.getLatestPublishedChapterTitles(orderedBooks.map((book) => book.id)),
      this.getUniqueReaderCountsForBooks(orderedBooks.map((book) => book.id)),
    ]);

    const libraryIds = [...new Set(orderedBooks.map((book) => book.library_id))];
    const libraries = libraryIds.length > 0 ? await this.libraryRepo.find({ where: { id: In(libraryIds) } }) : [];
    const libraryById = new Map(libraries.map((library) => [library.id, library]));

    return {
      id: series.id,
      nama: series.nama,
      books: orderedBooks.map((book) =>
        this.toCatalogDto(
          book,
          libraryById.get(book.library_id),
          (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t)),
          commentCountsByBook.get(book.id) ?? 0,
          latestChapterByBook.get(book.id) ?? null,
          null,
          uniqueReaderCountsByBook.get(book.id) ?? 0,
        ),
      ),
    };
  }

  async getBookBySlug(platform: Platform, bookSlug: string): Promise<BookDetailDto> {
    const book = await this.bookRepo.findOne({
      where: { slug: bookSlug, platform_id: platform.id },
      relations: ['genre', 'category'],
    });
    if (!book || !book.published_at) {
      throw new NotFoundException('Book not found');
    }

    const chapters = await this.chapterRepo.find({
      where: { book_id: book.id, status: 'published' },
      order: { order_index: 'ASC' },
    });

    if (chapters.length === 0) {
      throw new NotFoundException('Book not found');
    }

    const [library, tags, chapterCommentCounts, libraryStats, series, uniqueReaderCount] = await Promise.all([
      this.libraryRepo.findOne({ where: { id: book.library_id } }),
      this.tagsService.findTagsForBook(book.id),
      this.getCommentCountsForChapters(chapters),
      this.getLibraryAggregateStats(book.library_id),
      this.getSeriesForBooks([book.id]).then((map) => map.get(book.id) ?? null),
      this.getUniqueReaderCountsForBooks([book.id]).then((map) => map.get(book.id) ?? 0),
    ]);
    const commentCount = [...chapterCommentCounts.values()].reduce((sum, count) => sum + count, 0);

    return {
      id: book.id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre
        ? { id: book.genre.id, platformId: book.genre.platform_id, nama: book.genre.nama, slug: book.genre.slug }
        : null,
      category: book.category
        ? { id: book.category.id, platformId: book.category.platform_id, nama: book.category.nama, slug: book.category.slug }
        : null,
      tags: tags.map((t) => this.tagsService.toResponseDto(t)),
      series,
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      seoTitle: book.seo_title,
      seoDescription: book.seo_description,
      seoH1: book.seo_h1,
      seoOgTitle: book.seo_og_title,
      seoOgDescription: book.seo_og_description,
      seoOgType: book.seo_og_type,
      seoPrefix: book.seo_prefix,
      seoSuffix: book.seo_suffix,
      library: {
        id: library?.id ?? '',
        nama: library?.nama ?? '',
        slug: library?.slug ?? '',
        coverUrl: library?.cover_url ?? null,
        totalBooks: libraryStats.totalBooks,
        totalViews: libraryStats.totalViews,
        totalComments: libraryStats.totalComments,
      },
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        judul: chapter.judul,
        orderIndex: chapter.order_index,
        publishedAt: chapter.published_at,
        isFree: isChapterFree(platform.max_free_chapters, book.max_free_chapters, chapter.order_index),
        ratingAverage: Number(chapter.rating_average),
        ratingCount: chapter.rating_count,
        viewCount: chapter.view_count,
        commentCount: chapterCommentCounts.get(chapter.id) ?? 0,
      })),
      viewCount: book.view_count,
      ratingAverage: Number(book.rating_average),
      ratingCount: book.rating_count,
      likeCount: book.like_count,
      uniqueReaderCount,
      commentCount,
    };
  }

  /**
   * Konten 1 Chapter publik by (platformId, bookSlug, orderIndex). 404
   * kalau Book tidak ditemukan di Platform ini ATAU tidak ada Chapter di
   * order_index tsb ATAU statusnya bukan `published` (draft harus 404,
   * jangan bocor lewat URL tebakan).
   *
   * prev/nextOrderIndex dihitung dari Chapter published TERDEKAT di Book
   * yang sama (order_index terdekat di bawah/atas yang juga published —
   * melompati Chapter draft di antaranya), supaya reader app bisa render
   * tombol next/prev tanpa fetch daftar chapter terpisah.
   */
  async getChapterByOrderIndex(
    platform: Platform,
    bookSlug: string,
    orderIndex: number,
  ): Promise<ChapterDetailDto> {
    const book = await this.bookRepo.findOne({ where: { slug: bookSlug, platform_id: platform.id } });
    if (!book || !book.published_at) {
      throw new NotFoundException('Book not found');
    }

    const chapter = await this.chapterRepo.findOne({
      where: { book_id: book.id, order_index: orderIndex, status: 'published' },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const [prev, next] = await Promise.all([
      this.chapterRepo
        .createQueryBuilder('chapter')
        .where('chapter.book_id = :bookId', { bookId: book.id })
        .andWhere('chapter.status = :status', { status: 'published' })
        .andWhere('chapter.order_index < :orderIndex', { orderIndex })
        .orderBy('chapter.order_index', 'DESC')
        .getOne(),
      this.chapterRepo
        .createQueryBuilder('chapter')
        .where('chapter.book_id = :bookId', { bookId: book.id })
        .andWhere('chapter.status = :status', { status: 'published' })
        .andWhere('chapter.order_index > :orderIndex', { orderIndex })
        .orderBy('chapter.order_index', 'ASC')
        .getOne(),
    ]);

    return {
      id: chapter.id,
      judul: chapter.judul,
      konten: chapter.konten,
      orderIndex: chapter.order_index,
      publishedAt: chapter.published_at,
      book: { id: book.id, judul: book.judul, slug: book.slug, coverUrl: book.cover_url },
      prevOrderIndex: prev?.order_index ?? null,
      nextOrderIndex: next?.order_index ?? null,
      isFree: isChapterFree(platform.max_free_chapters, book.max_free_chapters, chapter.order_index),
      ratingAverage: Number(chapter.rating_average),
      ratingCount: chapter.rating_count,
      likeCount: chapter.like_count,
      commentCount: chapter.chat_topic_id
        ? await this.chatService.getCommentCountForTopic(chapter.chat_topic_id)
        : 0,
    };
  }

  /**
   * Fase 7 (18 Sep 2026) — catat 1x "buka" Chapter, dipanggil komponen client
   * `ChapterViewTracker` (fire-and-forget, TANPA syarat login — pembaca
   * anonim yang baca Chapter gratis tetap terhitung). SENGAJA endpoint POST
   * terpisah dari `getChapterByOrderIndex()` (yang di-cache ISR
   * `revalidate: 60` di reader app) — kalau dihitung di situ, buka berulang
   * dalam jendela cache tidak akan tercatat karena request tidak sampai ke
   * backend. `increment()` atomik (`UPDATE ... SET x = x + 1`, bukan
   * read-then-write) hindari race condition antar pembaca bersamaan.
   */
  async incrementChapterView(platform: Platform, bookSlug: string, orderIndex: number): Promise<void> {
    const book = await this.bookRepo.findOne({ where: { slug: bookSlug, platform_id: platform.id } });
    if (!book || !book.published_at) {
      throw new NotFoundException('Book not found');
    }

    const chapter = await this.chapterRepo.findOne({
      where: { book_id: book.id, order_index: orderIndex, status: 'published' },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    await Promise.all([
      this.chapterRepo.increment({ id: chapter.id }, 'view_count', 1),
      this.bookRepo.increment({ id: book.id }, 'view_count', 1),
    ]);
  }
}
