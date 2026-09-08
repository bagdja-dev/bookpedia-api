import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { LibrariesService } from '../libraries/libraries.service';
import { GenresService } from '../genres/genres.service';
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
  ) {}

  /**
   * Validasi `genreId` (kalau dikirim) match row `genres` manapun — 400
   * kalau tidak, JANGAN diam-diam null-kan. `null`/`undefined` diteruskan
   * apa adanya (undefined = field tidak dikirim, null = sengaja dikosongkan
   * saat update).
   */
  private async resolveGenreId(genreId: string | null | undefined): Promise<string | null | undefined> {
    if (genreId === undefined || genreId === null) {
      return genreId;
    }
    const exists = await this.genresService.existsById(genreId);
    if (!exists) {
      throw new BadRequestException(`genreId "${genreId}" tidak ditemukan — lihat GET /public/genres`);
    }
    return genreId;
  }

  /**
   * Resolve `library_id` milik user login — dipakai semua operasi Book di
   * bawah ini, dan dipakai ulang oleh ChaptersService (via BooksService)
   * untuk scoping `bookId` di route nested `/books/:bookId/chapters`.
   * User yang belum punya Library (belum onboarding) tidak boleh
   * membuat/melihat Book sama sekali.
   */
  async getLibraryIdForOwner(ownerUserId: string): Promise<string> {
    const library = await this.librariesService.findLibraryByOwner(ownerUserId);
    if (!library) {
      throw new NotFoundException(
        'Anda belum memiliki Library — buat Library terlebih dahulu sebelum menambah Book',
      );
    }
    return library.id;
  }

  async create(ownerUserId: string, dto: CreateBookDto): Promise<Book> {
    const libraryId = await this.getLibraryIdForOwner(ownerUserId);

    const existingSlug = await this.bookRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A book with this slug already exists');
    }

    const genreId = await this.resolveGenreId(dto.genreId);

    const book = this.bookRepo.create({
      library_id: libraryId,
      judul: dto.judul,
      slug: dto.slug,
      sinopsis: dto.sinopsis ?? null,
      genre_id: genreId ?? null,
      cover_url: dto.coverUrl ?? null,
      status: 'draft',
      book_type: dto.bookType ?? 'original',
      original_author: dto.originalAuthor ?? null,
    });

    const saved = await this.bookRepo.save(book);
    return this.findOneForOwner(ownerUserId, saved.id);
  }

  async findAllForOwner(ownerUserId: string): Promise<Book[]> {
    const libraryId = await this.getLibraryIdForOwner(ownerUserId);
    return this.bookRepo.find({
      where: { library_id: libraryId },
      relations: ['genre'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Scoped lookup — 404 kalau Book tidak ada ATAU bukan milik Library user
   * login (sengaja tidak dibedakan supaya tidak bocorkan keberadaan Book
   * orang lain).
   */
  async findOneForOwner(ownerUserId: string, bookId: string): Promise<Book> {
    const libraryId = await this.getLibraryIdForOwner(ownerUserId);
    const book = await this.bookRepo.findOne({
      where: { id: bookId, library_id: libraryId },
      relations: ['genre'],
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
      book.genre_id = await this.resolveGenreId(dto.genreId);
      // `book` di-load dengan `relations: ['genre']` (findOneForOwner) —
      // objek relasi `genre` yang sudah ter-load jadi BASI begitu kita ubah
      // `genre_id` mentah. TypeORM saat save() memprioritaskan objek relasi
      // yang ter-load di atas kolom FK mentah, jadi tanpa baris ini
      // `genre_id` baru (termasuk null) DIABAIKAN diam-diam — genre lama
      // tetap tersimpan. Set `undefined` (bukan null) supaya TypeORM
      // menganggap relasi "tidak diketahui", lalu mengikuti `genre_id`.
      book.genre = undefined;
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
      libraryId: book.library_id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre ? { id: book.genre.id, nama: book.genre.nama, slug: book.genre.slug } : null,
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
