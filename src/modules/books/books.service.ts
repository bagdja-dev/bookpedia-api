import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Library } from '../../entities/library.entity';
import { LibrariesService } from '../libraries/libraries.service';
import { GenresService } from '../genres/genres.service';
import { CategoriesService } from '../categories/categories.service';
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
  ) {}

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
    });

    const saved = await this.bookRepo.save(book);
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

    await this.bookRepo.save(book);
    return this.findOneForOwner(ownerUserId, bookId);
  }

  async remove(ownerUserId: string, bookId: string): Promise<void> {
    const book = await this.findOneForOwner(ownerUserId, bookId);
    await this.bookRepo.remove(book);
  }

  toResponseDto(book: Book): BookResponseDto {
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
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      publishedAt: book.published_at,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    };
  }
}
