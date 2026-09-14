import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Library } from '../../entities/library.entity';
import { LibrariesService } from '../libraries/libraries.service';
import { GenresService } from '../genres/genres.service';
import { CategoriesService } from '../categories/categories.service';
import { PlatformsService } from '../platforms/platforms.service';
import { TagsService } from '../tags/tags.service';
import { assertValidBookMaxFreeChapters } from '../../common/utils/free-chapters.util';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly librariesService: LibrariesService,
    private readonly genresService: GenresService,
    private readonly categoriesService: CategoriesService,
    private readonly platformsService: PlatformsService,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * Nilai `max_free_chapters` Platform saat ini — dipakai validasi override
   * Book (Fase 5, §11.2 overview.md). `platformId` bisa null untuk Book/
   * Library lama sebelum backfill Fase 4 §4.4 — dianggap tanpa batas (0)
   * karena tidak ada Platform yang bisa divalidasikan.
   */
  private async getPlatformMaxFreeChapters(platformId: string | null): Promise<number> {
    if (!platformId) return 0;
    const platform = await this.platformsService.findById(platformId);
    return platform?.max_free_chapters ?? 0;
  }

  /**
   * Nilai `max_tags_per_book` Platform saat ini (Fase 6, §12.2 overview.md).
   * `platformId` null (Book/Library lama sebelum backfill) dianggap tanpa
   * batas praktis — sama semangat dengan `getPlatformMaxFreeChapters()`.
   */
  private async getPlatformMaxTagsPerBook(platformId: string | null): Promise<number> {
    if (!platformId) return Number.MAX_SAFE_INTEGER;
    const platform = await this.platformsService.findById(platformId);
    return platform?.max_tags_per_book ?? Number.MAX_SAFE_INTEGER;
  }

  /**
   * Resolusi `tags` (Fase 6) — find-or-create lewat `TagsService`, divalidasi
   * dulu terhadap batas Platform SEBELUM bikin Tag baru (hindari Tag baru
   * "nyangkut" ter-create padahal ujungnya ditolak karena kelebihan batas).
   * `undefined` (field tidak dikirim) dibedakan dari `[]` (sengaja
   * dikosongkan) — keduanya valid, cuma `[]` yang benar-benar menghapus
   * seluruh Tag Book ini saat update.
   */
  private async resolveTagIds(
    platformId: string | null,
    tagNames: string[] | undefined,
  ): Promise<string[] | undefined> {
    if (tagNames === undefined) return undefined;

    const maxTags = await this.getPlatformMaxTagsPerBook(platformId);
    const distinctCount = new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean)).size;
    if (distinctCount > maxTags) {
      throw new BadRequestException(`Jumlah Tag melebihi batas Platform saat ini (maksimum ${maxTags}).`);
    }

    if (!platformId) return [];
    const tags = await this.tagsService.findOrCreateMany(platformId, tagNames);
    return tags.map((t) => t.id);
  }

  /**
   * Validasi `genreId` (kalau dikirim) match row `genres` manapun DAN
   * berasal dari `platform_id` yang sama dengan Book ini (Fase 4, §4.1) —
   * 400 kalau tidak, JANGAN diam-diam null-kan. `null`/`undefined`
   * diteruskan apa adanya (undefined = field tidak dikirim, null = sengaja
   * dikosongkan saat update).
   */
  private async resolveGenreId(
    genreId: string | null | undefined,
    platformId: string | null,
  ): Promise<string | null | undefined> {
    if (genreId === undefined || genreId === null) {
      return genreId;
    }
    const genre = await this.genresService.findById(genreId);
    if (!genre) {
      throw new BadRequestException(`genreId "${genreId}" tidak ditemukan — lihat GET /public/platforms/{slug}/genres`);
    }
    if (genre.platform_id !== platformId) {
      throw new BadRequestException(`genreId "${genreId}" bukan milik Platform yang sama dengan Book ini`);
    }
    return genreId;
  }

  /**
   * Validasi `categoryId` (kalau dikirim) — pola sama `resolveGenreId()`.
   * Dipilih terpisah dari `genreId` di form Book, TIDAK divalidasi harus
   * "cocok" dengan genre yang dipilih (Category & Genre independen di Book,
   * kaitan `genre_categories` cuma dipakai untuk kelompokkan dropdown Genre
   * di Studio).
   */
  private async resolveCategoryId(
    categoryId: string | null | undefined,
    platformId: string | null,
  ): Promise<string | null | undefined> {
    if (categoryId === undefined || categoryId === null) {
      return categoryId;
    }
    const category = await this.categoriesService.findById(categoryId);
    if (!category) {
      throw new BadRequestException(`categoryId "${categoryId}" tidak ditemukan`);
    }
    if (category.platform_id !== platformId) {
      throw new BadRequestException(`categoryId "${categoryId}" bukan milik Platform yang sama dengan Book ini`);
    }
    return categoryId;
  }

  /**
   * Resolve Library milik user login (entity penuh, bukan cuma id — supaya
   * `platform_id`-nya tersedia untuk denormalisasi ke Book) — dipakai semua
   * operasi Book di bawah ini, dan dipakai ulang oleh ChaptersService (via
   * BooksService) untuk scoping `bookId` di route nested
   * `/books/:bookId/chapters`. User yang belum punya Library (belum
   * onboarding) tidak boleh membuat/melihat Book sama sekali.
   */
  async getLibraryForOwner(ownerUserId: string): Promise<Library> {
    const library = await this.librariesService.findLibraryByOwner(ownerUserId);
    if (!library) {
      throw new NotFoundException(
        'Anda belum memiliki Library — buat Library terlebih dahulu sebelum menambah Book',
      );
    }
    return library;
  }

  async create(ownerUserId: string, dto: CreateBookDto): Promise<Book> {
    const library = await this.getLibraryForOwner(ownerUserId);

    const existingSlug = await this.bookRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A book with this slug already exists');
    }

    const genreId = await this.resolveGenreId(dto.genreId, library.platform_id);
    const categoryId = await this.resolveCategoryId(dto.categoryId, library.platform_id);

    const platformMaxFreeChapters = await this.getPlatformMaxFreeChapters(library.platform_id);
    assertValidBookMaxFreeChapters(platformMaxFreeChapters, dto.maxFreeChapters);

    const tagIds = await this.resolveTagIds(library.platform_id, dto.tags);

    const book = this.bookRepo.create({
      // Denormalisasi dari library.platform_id — TIDAK PERNAH dari client
      // (lihat entities/book.entity.ts doc-comment & execution-plan.md §4.1).
      platform_id: library.platform_id,
      library_id: library.id,
      judul: dto.judul,
      slug: dto.slug,
      sinopsis: dto.sinopsis ?? null,
      genre_id: genreId ?? null,
      category_id: categoryId ?? null,
      cover_url: dto.coverUrl ?? null,
      status: 'draft',
      book_type: dto.bookType ?? 'original',
      original_author: dto.originalAuthor ?? null,
      max_free_chapters: dto.maxFreeChapters ?? null,
    });

    const saved = await this.bookRepo.save(book);
    if (tagIds !== undefined) {
      await this.tagsService.replaceBookTags(saved.id, tagIds);
    }
    return this.findOneForOwner(ownerUserId, saved.id);
  }

  async findAllForOwner(ownerUserId: string): Promise<Book[]> {
    const library = await this.getLibraryForOwner(ownerUserId);
    return this.bookRepo.find({
      where: { library_id: library.id },
      relations: ['genre', 'category'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Scoped lookup — 404 kalau Book tidak ada ATAU bukan milik Library user
   * login (sengaja tidak dibedakan supaya tidak bocorkan keberadaan Book
   * orang lain).
   */
  async findOneForOwner(ownerUserId: string, bookId: string): Promise<Book> {
    const library = await this.getLibraryForOwner(ownerUserId);
    const book = await this.bookRepo.findOne({
      where: { id: bookId, library_id: library.id },
      relations: ['genre', 'category'],
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async update(ownerUserId: string, bookId: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOneForOwner(ownerUserId, bookId);

    if (dto.judul !== undefined) book.judul = dto.judul;
    if (dto.sinopsis !== undefined) book.sinopsis = dto.sinopsis;
    if (dto.genreId !== undefined) {
      book.genre_id = await this.resolveGenreId(dto.genreId, book.platform_id);
      // `book` di-load dengan `relations: ['genre']` (findOneForOwner) —
      // objek relasi `genre` yang sudah ter-load jadi BASI begitu kita ubah
      // `genre_id` mentah. TypeORM saat save() memprioritaskan objek relasi
      // yang ter-load di atas kolom FK mentah, jadi tanpa baris ini
      // `genre_id` baru (termasuk null) DIABAIKAN diam-diam — genre lama
      // tetap tersimpan. Set `undefined` (bukan null) supaya TypeORM
      // menganggap relasi "tidak diketahui", lalu mengikuti `genre_id`.
      book.genre = undefined;
    }
    if (dto.categoryId !== undefined) {
      book.category_id = await this.resolveCategoryId(dto.categoryId, book.platform_id);
      // Sama alasan seperti `book.genre = undefined` di atas — relasi
      // `category` yang sudah ter-load (findOneForOwner) jadi basi begitu
      // `category_id` mentah diubah, TypeORM save() memprioritaskan objek
      // relasi lama kalau tidak di-undefined-kan.
      book.category = undefined;
    }
    if (dto.coverUrl !== undefined) book.cover_url = dto.coverUrl;
    if (dto.status !== undefined) book.status = dto.status;
    if (dto.published !== undefined) {
      book.published_at = dto.published ? new Date() : null;
    }
    if (dto.bookType !== undefined) book.book_type = dto.bookType;
    if (dto.originalAuthor !== undefined) book.original_author = dto.originalAuthor || null;
    if (dto.maxFreeChapters !== undefined) {
      const platformMaxFreeChapters = await this.getPlatformMaxFreeChapters(book.platform_id);
      assertValidBookMaxFreeChapters(platformMaxFreeChapters, dto.maxFreeChapters);
      book.max_free_chapters = dto.maxFreeChapters;
    }

    const tagIds = await this.resolveTagIds(book.platform_id, dto.tags);

    await this.bookRepo.save(book);
    if (tagIds !== undefined) {
      await this.tagsService.replaceBookTags(book.id, tagIds);
    }
    return this.findOneForOwner(ownerUserId, bookId);
  }

  async remove(ownerUserId: string, bookId: string): Promise<void> {
    const book = await this.findOneForOwner(ownerUserId, bookId);
    await this.bookRepo.remove(book);
  }

  async toResponseDto(book: Book): Promise<BookResponseDto> {
    const tags = await this.tagsService.findTagsForBook(book.id);
    return this.buildResponseDto(book, tags.map((t) => this.tagsService.toResponseDto(t)));
  }

  /** Batch — dipakai `findAll()` supaya tidak N+1 query Tag per Book. */
  async toResponseDtos(books: Book[]): Promise<BookResponseDto[]> {
    const tagsByBook = await this.tagsService.findTagsForBooks(books.map((b) => b.id));
    return books.map((book) =>
      this.buildResponseDto(book, (tagsByBook.get(book.id) ?? []).map((t) => this.tagsService.toResponseDto(t))),
    );
  }

  private buildResponseDto(book: Book, tags: BookResponseDto['tags']): BookResponseDto {
    return {
      id: book.id,
      platformId: book.platform_id,
      libraryId: book.library_id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre
        ? { id: book.genre.id, platformId: book.genre.platform_id, nama: book.genre.nama, slug: book.genre.slug }
        : null,
      category: book.category ? this.categoriesService.toSummaryDto(book.category) : null,
      tags,
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      publishedAt: book.published_at,
      maxFreeChapters: book.max_free_chapters,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    };
  }
}
