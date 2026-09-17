import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { ReadingProgress } from '../../entities/reading-progress.entity';
import { PutReadingProgressDto } from './dto/put-reading-progress.dto';
import { ReadingProgressResponseDto } from './dto/reading-progress-response.dto';
import { ReadingProgressListItemDto } from './dto/reading-progress-list-item.dto';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  /**
   * User login di module ini adalah PEMBACA, bukan pemilik Book/Library —
   * scoping-nya beda dari ChaptersService (owner-scoped). Validasi di sini:
   * chapterId harus Chapter yang ADA, book_id-nya sama dengan bookId yang
   * dikirim, DAN status published. Query Chapter langsung lewat repository
   * (pola sama seperti PublicService), TIDAK lewat ChaptersService/BooksService.
   */
  private async getPublishedChapterOfBook(bookId: string, chapterId: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId, book_id: bookId, status: 'published' },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  /** Upsert by (user_id, book_id) — update last_chapter_id+updated_at kalau sudah ada, insert baru kalau belum. */
  async upsert(userId: string, dto: PutReadingProgressDto): Promise<ReadingProgressResponseDto> {
    const chapter = await this.getPublishedChapterOfBook(dto.bookId, dto.chapterId);

    let progress = await this.progressRepo.findOne({
      where: { user_id: userId, book_id: dto.bookId },
    });

    if (progress) {
      progress.last_chapter_id = chapter.id;
    } else {
      progress = this.progressRepo.create({
        user_id: userId,
        book_id: dto.bookId,
        last_chapter_id: chapter.id,
      });
    }

    progress = await this.progressRepo.save(progress);

    return {
      bookId: progress.book_id,
      lastChapterId: chapter.id,
      lastChapterOrderIndex: chapter.order_index,
      lastChapterJudul: chapter.judul,
      isPublic: progress.is_public,
      updatedAt: progress.updated_at,
    };
  }

  /** 404 kalau user login belum pernah punya progress untuk Book ini (JANGAN 200+null, lihat catatan bug NestJS di commit fcf19b7). */
  async findOneForBook(userId: string, bookId: string): Promise<ReadingProgressResponseDto> {
    const progress = await this.progressRepo.findOne({ where: { user_id: userId, book_id: bookId } });
    if (!progress) {
      throw new NotFoundException('Reading progress not found');
    }

    // last_chapter_id dijamin masih ada selama progress-nya ada (FK ON DELETE
    // CASCADE menghapus baris progress kalau Chapter-nya dihapus), tapi tetap
    // ditangani defensif kalau-kalau.
    const chapter = await this.chapterRepo.findOne({ where: { id: progress.last_chapter_id } });

    return {
      bookId: progress.book_id,
      lastChapterId: progress.last_chapter_id,
      lastChapterOrderIndex: chapter?.order_index ?? 0,
      lastChapterJudul: chapter?.judul ?? '',
      isPublic: progress.is_public,
      updatedAt: progress.updated_at,
    };
  }

  /** Semua progress user login, lintas Book, urut updated_at DESC, limit 20. Book/Chapter di-batch-fetch (bukan N+1). */
  async findAllForUser(userId: string): Promise<ReadingProgressListItemDto[]> {
    const progresses = await this.progressRepo.find({
      where: { user_id: userId },
      order: { updated_at: 'DESC' },
      take: 20,
    });

    if (progresses.length === 0) {
      return [];
    }

    const bookIds = [...new Set(progresses.map((progress) => progress.book_id))];
    const chapterIds = [...new Set(progresses.map((progress) => progress.last_chapter_id))];

    const [books, chapters] = await Promise.all([
      this.bookRepo.find({ where: { id: In(bookIds) } }),
      this.chapterRepo.find({ where: { id: In(chapterIds) } }),
    ]);

    const bookById = new Map(books.map((book) => [book.id, book]));
    const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

    return progresses.map((progress) => {
      const book = bookById.get(progress.book_id);
      const chapter = chapterById.get(progress.last_chapter_id);

      return {
        bookId: progress.book_id,
        bookJudul: book?.judul ?? '',
        bookSlug: book?.slug ?? '',
        bookCoverUrl: book?.cover_url ?? null,
        lastChapterId: progress.last_chapter_id,
        lastChapterOrderIndex: chapter?.order_index ?? 0,
        lastChapterJudul: chapter?.judul ?? '',
        isPublic: progress.is_public,
        updatedAt: progress.updated_at,
      };
    });
  }

  async updateVisibility(userId: string, bookId: string, isPublic: boolean): Promise<ReadingProgressResponseDto> {
    const progress = await this.progressRepo.findOne({ where: { user_id: userId, book_id: bookId } });
    if (!progress) {
      throw new NotFoundException('Reading progress not found');
    }

    progress.is_public = isPublic;
    const saved = await this.progressRepo.save(progress);
    const chapter = await this.chapterRepo.findOne({ where: { id: saved.last_chapter_id } });

    return {
      bookId: saved.book_id,
      lastChapterId: saved.last_chapter_id,
      lastChapterOrderIndex: chapter?.order_index ?? 0,
      lastChapterJudul: chapter?.judul ?? '',
      isPublic: saved.is_public,
      updatedAt: saved.updated_at,
    };
  }
}
