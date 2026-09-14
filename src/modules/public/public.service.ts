import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { Platform } from '../../entities/platform.entity';
import { PlatformsService } from '../platforms/platforms.service';
import { BookCatalogDto } from './dto/book-catalog.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { LibraryProfileDto } from './dto/library-profile.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { ChapterDetailDto } from './dto/chapter-detail.dto';
import { PlatformResolveResponseDto } from './dto/platform-resolve-response.dto';
import { PlatformPublicProfileDto } from './dto/platform-public-profile.dto';
import { TagResponseDto } from '../tags/dto/tag-response.dto';
import { TagsService } from '../tags/tags.service';
import { SitemapEntriesDto } from './dto/sitemap-entries.dto';
import { isChapterFree } from '../../common/utils/free-chapters.util';

/** SQL fragment: Book ini "discoverable" publik kalau punya minimal 1 Chapter published. */
const HAS_PUBLISHED_CHAPTER_SQL =
  "EXISTS (SELECT 1 FROM chapters c WHERE c.book_id = book.id AND c.status = 'published')";

/**
 * Book "discoverable" publik butuh DUA syarat sekaligus: saklar publikasi
 * level Book aktif (`published_at IS NOT NULL`) DAN minimal 1 Chapter
 * published. Revisi 9 Sep 2026 — sebelumnya hanya syarat kedua, Book
 * otomatis "hidup" begitu 1 chapter dipublish tanpa momen rilis eksplisit.
 */
const IS_BOOK_PUBLISHED_SQL = 'book.published_at IS NOT NULL';

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
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly platformsService: PlatformsService,
    private readonly tagsService: TagsService,
  ) {}

  async resolvePlatformBySlugOrThrow(platformSlug: string): Promise<Platform> {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
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
      colors: platform.colors,
      lockStudio: platform.lock_studio,
      rendererKey: platform.renderer_key,
      maxFreeChapters: platform.max_free_chapters,
      showBookStatus: platform.show_book_status,
      maxTagsPerBook: platform.max_tags_per_book,
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

  /** Batch-resolve Library nama/slug + Tag untuk sekumpulan Book — satu query IN per jenis, bukan per-baris. */
  private async toCatalogDtos(books: Book[]): Promise<BookCatalogDto[]> {
    if (books.length === 0) {
      return [];
    }

    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const [libraries, tagsByBook] = await Promise.all([
      this.libraryRepo.find({ where: { id: In(libraryIds) } }),
      this.tagsService.findTagsForBooks(books.map((book) => book.id)),
    ]);
    const libraryById = new Map(libraries.map((library) => [library.id, library]));

    return books.map((book) =>
      this.toCatalogDto(
        book,
        libraryById.get(book.library_id),
        (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t)),
      ),
    );
  }

  private toCatalogDto(book: Book, library: Library | undefined, tags: TagResponseDto[]): BookCatalogDto {
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
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      library: { nama: library?.nama ?? '', slug: library?.slug ?? '' },
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
    const libraries = libraryIds.length > 0 ? await this.libraryRepo.find({ where: { id: In(libraryIds) } }) : [];

    return {
      books: books.map((book) => ({ slug: book.slug, updatedAt: book.updated_at })),
      libraries: libraries.map((library) => ({ slug: library.slug, updatedAt: library.updated_at })),
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

    const tagsByBook = await this.tagsService.findTagsForBooks(books.map((book) => book.id));

    return {
      id: library.id,
      nama: library.nama,
      slug: library.slug,
      deskripsi: library.deskripsi,
      coverUrl: library.cover_url,
      createdAt: library.created_at,
      books: books.map((book) =>
        this.toCatalogDto(book, library, (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t))),
      ),
    };
  }

  /**
   * Detail Book publik by slug (di-scope ke satu Platform) — 404 kalau slug
   * tidak ditemukan di Platform ini ATAU Book itu tidak punya Chapter
   * published sama sekali (tidak "discoverable" publik, meski row-nya ada
   * di DB). `chapters` HANYA yang published, urut order_index ASC.
   */
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

    const [library, tags] = await Promise.all([
      this.libraryRepo.findOne({ where: { id: book.library_id } }),
      this.tagsService.findTagsForBook(book.id),
    ]);

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
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      library: { nama: library?.nama ?? '', slug: library?.slug ?? '' },
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        judul: chapter.judul,
        orderIndex: chapter.order_index,
        publishedAt: chapter.published_at,
        isFree: isChapterFree(platform.max_free_chapters, book.max_free_chapters, chapter.order_index),
      })),
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
    };
  }
}
