import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { LibrariesService } from '../libraries/libraries.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly librariesService: LibrariesService,
  ) {}

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

    const book = this.bookRepo.create({
      library_id: libraryId,
      judul: dto.judul,
      slug: dto.slug,
      sinopsis: dto.sinopsis ?? null,
      genre: dto.genre ?? null,
      cover_url: dto.coverUrl ?? null,
      status: 'draft',
    });

    return this.bookRepo.save(book);
  }

  async findAllForOwner(ownerUserId: string): Promise<Book[]> {
    const libraryId = await this.getLibraryIdForOwner(ownerUserId);
    return this.bookRepo.find({ where: { library_id: libraryId }, order: { created_at: 'DESC' } });
  }

  /**
   * Scoped lookup — 404 kalau Book tidak ada ATAU bukan milik Library user
   * login (sengaja tidak dibedakan supaya tidak bocorkan keberadaan Book
   * orang lain).
   */
  async findOneForOwner(ownerUserId: string, bookId: string): Promise<Book> {
    const libraryId = await this.getLibraryIdForOwner(ownerUserId);
    const book = await this.bookRepo.findOne({ where: { id: bookId, library_id: libraryId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async update(ownerUserId: string, bookId: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOneForOwner(ownerUserId, bookId);

    if (dto.judul !== undefined) book.judul = dto.judul;
    if (dto.sinopsis !== undefined) book.sinopsis = dto.sinopsis;
    if (dto.genre !== undefined) book.genre = dto.genre;
    if (dto.coverUrl !== undefined) book.cover_url = dto.coverUrl;
    if (dto.status !== undefined) book.status = dto.status;

    return this.bookRepo.save(book);
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
      genre: book.genre,
      coverUrl: book.cover_url,
      status: book.status,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    };
  }
}
