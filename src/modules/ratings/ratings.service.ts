import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { BookRating } from '../../entities/book-rating.entity';
import { Platform } from '../../entities/platform.entity';
import { PlatformsService } from '../platforms/platforms.service';
import { PutBookRatingDto } from './dto/put-book-rating.dto';
import { PutChapterRatingDto } from './dto/put-chapter-rating.dto';
import { BookRatingResponseDto } from './dto/book-rating-response.dto';
import { ChapterRatingResponseDto } from './dto/chapter-rating-response.dto';

/**
 * Fase 7 (18 Sep 2026) — dua method upsert terpisah karena grain-nya beda
 * (Book vs Chapter), TAPI keduanya menulis ke tabel `book_ratings` yang sama
 * (dibedakan `chapter_id`) supaya agregat ke level Book selalu dari sumber
 * yang sama. Tiap method memvalidasi `platform.enable_rating` DAN
 * `platform.rating_mode` sesuai grain-nya SENDIRI (pertahanan berlapis —
 * frontend cuma menampilkan widget yang sesuai mode, backend tetap menolak
 * submit yang tidak cocok mode saat ini). Lihat plan/bookpedia/overview.md §13.
 */
@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(BookRating)
    private readonly ratingRepo: Repository<BookRating>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    private readonly platformsService: PlatformsService,
  ) {}

  private async getPublishedBookOrThrow(bookId: string): Promise<Book> {
    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book || !book.published_at) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  private async getPlatformOfBookOrThrow(book: Book): Promise<Platform> {
    const platform = book.platform_id ? await this.platformsService.findById(book.platform_id) : null;
    if (!platform) {
      throw new NotFoundException('Book not found');
    }
    return platform;
  }

  async upsertBookRating(userId: string, dto: PutBookRatingDto): Promise<BookRatingResponseDto> {
    const book = await this.getPublishedBookOrThrow(dto.bookId);
    const platform = await this.getPlatformOfBookOrThrow(book);

    if (!platform.enable_rating) {
      throw new BadRequestException('Rating dinonaktifkan untuk Platform ini');
    }
    if (platform.rating_mode !== 'book') {
      throw new BadRequestException('Platform ini menggunakan mode rating per-Chapter, bukan per-Book');
    }

    let row = await this.ratingRepo.findOne({ where: { user_id: userId, book_id: book.id, chapter_id: IsNull() } });
    if (row) {
      row.rating = dto.rating;
    } else {
      row = this.ratingRepo.create({ user_id: userId, book_id: book.id, chapter_id: null, rating: dto.rating });
    }
    row = await this.ratingRepo.save(row);

    await this.recomputeBookAggregate(book.id, 'null');

    return { bookId: book.id, rating: row.rating, updatedAt: row.updated_at };
  }

  async upsertChapterRating(userId: string, dto: PutChapterRatingDto): Promise<ChapterRatingResponseDto> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId, status: 'published' } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    const book = await this.getPublishedBookOrThrow(chapter.book_id);
    const platform = await this.getPlatformOfBookOrThrow(book);

    if (!platform.enable_rating) {
      throw new BadRequestException('Rating dinonaktifkan untuk Platform ini');
    }
    if (platform.rating_mode !== 'chapter') {
      throw new BadRequestException('Platform ini menggunakan mode rating per-Book, bukan per-Chapter');
    }

    let row = await this.ratingRepo.findOne({ where: { user_id: userId, chapter_id: chapter.id } });
    if (row) {
      row.rating = dto.rating;
    } else {
      row = this.ratingRepo.create({ user_id: userId, book_id: book.id, chapter_id: chapter.id, rating: dto.rating });
    }
    row = await this.ratingRepo.save(row);

    await this.recomputeChapterAggregate(chapter.id);
    // Agregat Book dari SELURUH rating individual semua Chapter-nya (bukan
    // rata-rata-dari-rata-rata per-Chapter) — lihat overview.md §13.2.
    await this.recomputeBookAggregate(book.id, 'notNull');

    return { chapterId: chapter.id, rating: row.rating, updatedAt: row.updated_at };
  }

  async findUserBookRating(userId: string, bookId: string): Promise<BookRatingResponseDto> {
    const row = await this.ratingRepo.findOne({ where: { user_id: userId, book_id: bookId, chapter_id: IsNull() } });
    if (!row) {
      throw new NotFoundException('Rating not found');
    }
    return { bookId: row.book_id, rating: row.rating, updatedAt: row.updated_at };
  }

  async findUserChapterRating(userId: string, chapterId: string): Promise<ChapterRatingResponseDto> {
    const row = await this.ratingRepo.findOne({ where: { user_id: userId, chapter_id: chapterId } });
    if (!row) {
      throw new NotFoundException('Rating not found');
    }
    return { chapterId: row.chapter_id as string, rating: row.rating, updatedAt: row.updated_at };
  }

  /**
   * `chapterScope`: 'null' = agregat mode-Book (rating langsung ke Book),
   * 'notNull' = agregat mode-Chapter (rata-rata SEMUA rating individual
   * Chapter Book ini, bukan rata-rata-dari-rata-rata per-Chapter).
   */
  private async recomputeBookAggregate(bookId: string, chapterScope: 'null' | 'notNull'): Promise<void> {
    const qb = this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.book_id = :bookId', { bookId });
    qb.andWhere(chapterScope === 'null' ? 'r.chapter_id IS NULL' : 'r.chapter_id IS NOT NULL');

    const result = await qb.getRawOne<{ avg: string | null; count: string }>();
    await this.bookRepo.update(
      { id: bookId },
      { rating_average: Number(result?.avg ?? 0), rating_count: Number(result?.count ?? 0) },
    );
  }

  private async recomputeChapterAggregate(chapterId: string): Promise<void> {
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.chapter_id = :chapterId', { chapterId })
      .getRawOne<{ avg: string | null; count: string }>();

    await this.chapterRepo.update(
      { id: chapterId },
      { rating_average: Number(result?.avg ?? 0), rating_count: Number(result?.count ?? 0) },
    );
  }
}
