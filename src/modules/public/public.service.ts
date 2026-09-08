import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { BookCatalogDto } from './dto/book-catalog.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { LibraryProfileDto } from './dto/library-profile.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { ChapterDetailDto } from './dto/chapter-detail.dto';

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

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
  ) {}

  /**
   * Katalog pusat lintas semua Library — HANYA Book dengan minimal 1
   * Chapter `published` (EXISTS subquery, bukan JOIN — supaya tidak ada
   * baris ganda per Book & tidak butuh DISTINCT). Library nama/slug
   * di-batch-fetch sekali per page (bukan N+1 per Book).
   */
  async getCatalog(query: CatalogQueryDto): Promise<CatalogResponseDto> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .where(IS_BOOK_PUBLISHED_SQL)
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

    qb.orderBy('book.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [books, total] = await qb.getManyAndCount();
    const items = await this.toCatalogDtos(books);

    return { items, total, page, limit };
  }

  /** Batch-resolve Library nama/slug untuk sekumpulan Book — satu query IN, bukan per-baris. */
  private async toCatalogDtos(books: Book[]): Promise<BookCatalogDto[]> {
    if (books.length === 0) {
      return [];
    }

    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const libraries = await this.libraryRepo.find({ where: { id: In(libraryIds) } });
    const libraryById = new Map(libraries.map((library) => [library.id, library]));

    return books.map((book) => this.toCatalogDto(book, libraryById.get(book.library_id)));
  }

  private toCatalogDto(book: Book, library: Library | undefined): BookCatalogDto {
    return {
      id: book.id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre ? { id: book.genre.id, nama: book.genre.nama, slug: book.genre.slug } : null,
      coverUrl: book.cover_url,
      status: book.status,
      bookType: book.book_type,
      originalAuthor: book.original_author,
      library: { nama: library?.nama ?? '', slug: library?.slug ?? '' },
    };
  }

  /**
   * Profil publik Library by slug — `books` HANYA yang punya minimal 1
   * Chapter published (aturan sama seperti katalog). 404 kalau slug tidak
   * ditemukan.
   */
  async getLibraryBySlug(slug: string): Promise<LibraryProfileDto> {
    const library = await this.libraryRepo.findOne({ where: { slug } });
    if (!library) {
      throw new NotFoundException('Library not found');
    }

    const books = await this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.genre', 'genre')
      .where('book.library_id = :libraryId', { libraryId: library.id })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
      .orderBy('book.created_at', 'DESC')
      .getMany();

    return {
      id: library.id,
      nama: library.nama,
      slug: library.slug,
      deskripsi: library.deskripsi,
      coverUrl: library.cover_url,
      createdAt: library.created_at,
      books: books.map((book) => this.toCatalogDto(book, library)),
    };
  }

  /**
   * Detail Book publik by slug — 404 kalau slug tidak ditemukan ATAU Book
   * itu tidak punya Chapter published sama sekali (tidak "discoverable"
   * publik, meski row-nya ada di DB). `chapters` HANYA yang published, urut
   * order_index ASC.
   */
  async getBookBySlug(slug: string): Promise<BookDetailDto> {
    const book = await this.bookRepo.findOne({ where: { slug }, relations: ['genre'] });
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

    const library = await this.libraryRepo.findOne({ where: { id: book.library_id } });

    return {
      id: book.id,
      judul: book.judul,
      slug: book.slug,
      sinopsis: book.sinopsis,
      genre: book.genre ? { id: book.genre.id, nama: book.genre.nama, slug: book.genre.slug } : null,
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
      })),
    };
  }

  /**
   * Konten 1 Chapter publik by (bookSlug, orderIndex). 404 kalau Book tidak
   * ditemukan ATAU tidak ada Chapter di order_index tsb ATAU statusnya bukan
   * `published` (draft harus 404, jangan bocor lewat URL tebakan).
   *
   * prev/nextOrderIndex dihitung dari Chapter published TERDEKAT di Book
   * yang sama (order_index terdekat di bawah/atas yang juga published —
   * melompati Chapter draft di antaranya), supaya reader app bisa render
   * tombol next/prev tanpa fetch daftar chapter terpisah.
   */
  async getChapterByOrderIndex(bookSlug: string, orderIndex: number): Promise<ChapterDetailDto> {
    const book = await this.bookRepo.findOne({ where: { slug: bookSlug } });
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
      book: { id: book.id, judul: book.judul, slug: book.slug },
      prevOrderIndex: prev?.order_index ?? null,
      nextOrderIndex: next?.order_index ?? null,
    };
  }
}
