import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { ChapterHighlight } from '../../entities/chapter-highlight.entity';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { HighlightResponseDto } from './dto/highlight-response.dto';
import { HighlightListItemDto } from './dto/highlight-list-item.dto';

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(ChapterHighlight)
    private readonly highlightRepo: Repository<ChapterHighlight>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  /**
   * User login di module ini adalah PEMBACA, bukan pemilik Book/Library —
   * chapterId harus Chapter yang ADA dan status published (404 kalau
   * tidak). Query Chapter langsung lewat repository (pola sama seperti
   * PublicService/ReadingProgressService), TIDAK lewat ChaptersService yang
   * owner-scoped.
   */
  private async getPublishedChapter(chapterId: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id: chapterId, status: 'published' } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  /** content_version DIISI SERVER-SIDE dari content_version Chapter saat ini — client tidak kirim field ini. */
  async create(userId: string, chapterId: string, dto: CreateHighlightDto): Promise<HighlightResponseDto> {
    const chapter = await this.getPublishedChapter(chapterId);

    if (dto.endOffset <= dto.startOffset) {
      throw new BadRequestException('endOffset harus lebih besar dari startOffset');
    }

    const highlight = this.highlightRepo.create({
      user_id: userId,
      chapter_id: chapter.id,
      start_offset: dto.startOffset,
      end_offset: dto.endOffset,
      content_version: chapter.content_version,
    });

    const saved = await this.highlightRepo.save(highlight);
    return this.toResponseDto(saved);
  }

  /**
   * Highlight milik user login UNTUK 1 Chapter SAJA, DIFILTER hanya yang
   * content_version snapshot-nya SAMA dengan content_version Chapter SAAT
   * INI (anti-drift) — dipakai render overlay highlight di halaman baca.
   * Highlight "basi" TIDAK ikut di sini, beda dari findAllForUser().
   */
  async findAllForChapter(userId: string, chapterId: string): Promise<HighlightResponseDto[]> {
    const chapter = await this.getPublishedChapter(chapterId);

    const highlights = await this.highlightRepo.find({
      where: { user_id: userId, chapter_id: chapter.id, content_version: chapter.content_version },
      order: { created_at: 'ASC' },
    });

    return highlights.map((highlight) => this.toResponseDto(highlight));
  }

  /**
   * SEMUA highlight milik user login, lintas Book/Chapter, TERMASUK yang
   * basi — dipakai halaman "Highlight Saya" (tampilkan semua + tandai basi
   * lewat `isStale`). Book/Chapter di-batch-fetch (bukan N+1 per highlight).
   */
  async findAllForUser(userId: string): Promise<HighlightListItemDto[]> {
    const highlights = await this.highlightRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    if (highlights.length === 0) {
      return [];
    }

    const chapterIds = [...new Set(highlights.map((highlight) => highlight.chapter_id))];
    const chapters = await this.chapterRepo.find({ where: { id: In(chapterIds) } });
    const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

    const bookIds = [...new Set(chapters.map((chapter) => chapter.book_id))];
    const books = await this.bookRepo.find({ where: { id: In(bookIds) } });
    const bookById = new Map(books.map((book) => [book.id, book]));

    return highlights.map((highlight) => {
      const chapter = chapterById.get(highlight.chapter_id);
      const book = chapter ? bookById.get(chapter.book_id) : undefined;

      return {
        id: highlight.id,
        chapterId: highlight.chapter_id,
        startOffset: highlight.start_offset,
        endOffset: highlight.end_offset,
        contentVersion: highlight.content_version,
        isStale: chapter ? highlight.content_version !== chapter.content_version : true,
        createdAt: highlight.created_at,
        chapter: { judul: chapter?.judul ?? '', orderIndex: chapter?.order_index ?? 0 },
        book: { judul: book?.judul ?? '', slug: book?.slug ?? '' },
      };
    });
  }

  /** Scoped milik user login — 404 kalau highlight tidak ada ATAU bukan milik user ini. */
  async remove(userId: string, id: string): Promise<void> {
    const highlight = await this.highlightRepo.findOne({ where: { id, user_id: userId } });
    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }
    await this.highlightRepo.remove(highlight);
  }

  private toResponseDto(highlight: ChapterHighlight): HighlightResponseDto {
    return {
      id: highlight.id,
      chapterId: highlight.chapter_id,
      startOffset: highlight.start_offset,
      endOffset: highlight.end_offset,
      contentVersion: highlight.content_version,
      createdAt: highlight.created_at,
    };
  }
}
