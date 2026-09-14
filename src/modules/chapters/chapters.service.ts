import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Chapter } from '../../entities/chapter.entity';
import { BooksService } from '../books/books.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';

@Injectable()
export class ChaptersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    private readonly booksService: BooksService,
  ) {}

  /**
   * Scoping wajib: bookId di URL harus Book yang Library-nya milik user
   * login — reuse BooksService.findOneForOwner() (sudah 404 kalau bukan
   * miliknya), supaya tidak ada jalur akses Chapter tanpa lewat Book yang
   * tervalidasi.
   */
  private async getOwnedBook(ownerUserId: string, bookId: string) {
    return this.booksService.findOneForOwner(ownerUserId, bookId);
  }

  async create(ownerUserId: string, bookId: string, dto: CreateChapterDto): Promise<Chapter> {
    const book = await this.getOwnedBook(ownerUserId, bookId);

    const { maxOrder } = await this.chapterRepo
      .createQueryBuilder('chapter')
      .select('MAX(chapter.order_index)', 'maxOrder')
      .where('chapter.book_id = :bookId', { bookId: book.id })
      .getRawOne<{ maxOrder: number | null }>();

    const nextOrderIndex = (maxOrder ?? 0) + 1;

    const chapter = this.chapterRepo.create({
      book_id: book.id,
      judul: dto.judul,
      konten: dto.konten ?? '',
      order_index: nextOrderIndex,
      status: 'draft',
      content_version: 1,
      published_at: null,
    });

    return this.chapterRepo.save(chapter);
  }

  async findAllForBook(ownerUserId: string, bookId: string): Promise<Chapter[]> {
    const book = await this.getOwnedBook(ownerUserId, bookId);
    return this.chapterRepo.find({ where: { book_id: book.id }, order: { order_index: 'ASC' } });
  }

  /** 404 kalau Chapter tidak ada ATAU bukan milik bookId (yang sudah tervalidasi milik user login). */
  async findOneForBook(ownerUserId: string, bookId: string, chapterId: string): Promise<Chapter> {
    const book = await this.getOwnedBook(ownerUserId, bookId);
    const chapter = await this.chapterRepo.findOne({ where: { id: chapterId, book_id: book.id } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  /**
   * Aturan bisnis anti-drift highlight (Fase 3) & publish state — JANGAN
   * diubah/dilewati (lihat execution-plan.md Fase 1 & schema.dbml note
   * `chapters.content_version`):
   * - content_version naik +1 HANYA kalau `konten` dikirim DAN nilainya
   *   benar-benar beda dari yang tersimpan saat ini.
   * - status draft->published: published_at = now(). published->draft:
   *   published_at di-null-kan lagi. Status sama dengan saat ini: no-op.
   */
  async update(ownerUserId: string, bookId: string, chapterId: string, dto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.findOneForBook(ownerUserId, bookId, chapterId);

    if (dto.judul !== undefined) {
      chapter.judul = dto.judul;
    }

    if (dto.konten !== undefined && dto.konten !== chapter.konten) {
      chapter.konten = dto.konten;
      chapter.content_version += 1;
    }

    if (dto.status !== undefined && dto.status !== chapter.status) {
      if (dto.status === 'published' && chapter.status === 'draft') {
        chapter.published_at = new Date();
      } else if (dto.status === 'draft') {
        chapter.published_at = null;
      }
      chapter.status = dto.status;
    }

    return this.chapterRepo.save(chapter);
  }

  /**
   * Update `order_index` banyak Chapter sekaligus dalam SATU DB transaction
   * (pola sama seperti locking transaksional Place Bid di bagdja-auction-api
   * — di sini tidak butuh row lock pessimistic karena bukan concurrent
   * bidding, tapi tetap wajib transactional supaya gagal di tengah tidak
   * meninggalkan order_index duplikat/hilang). Unique constraint
   * (book_id, order_index) DEFERRABLE INITIALLY DEFERRED di migration SQL
   * membiarkan state antara di dalam transaction sementara "duplikat" saat
   * proses swap, constraint baru dicek final saat COMMIT.
   */
  async reorder(ownerUserId: string, bookId: string, dto: ReorderChaptersDto): Promise<Chapter[]> {
    const book = await this.getOwnedBook(ownerUserId, bookId);

    const existingChapters = await this.chapterRepo.find({ where: { book_id: book.id } });
    const existingIds = new Set(existingChapters.map((c) => c.id));

    for (const item of dto.items) {
      if (!existingIds.has(item.id)) {
        throw new BadRequestException(`Chapter ${item.id} bukan milik Book ini`);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const txChapterRepo = manager.getRepository(Chapter);
      for (const item of dto.items) {
        await txChapterRepo.update({ id: item.id, book_id: book.id }, { order_index: item.orderIndex });
      }
    });

    return this.chapterRepo.find({ where: { book_id: book.id }, order: { order_index: 'ASC' } });
  }

  /**
   * Scoped sama seperti operasi lain (bookId harus milik user login,
   * chapterId harus milik bookId itu). TIDAK ada renormalisasi
   * `order_index` Chapter lain sisanya — gap boleh, list tetap urut benar
   * (ORDER BY order_index ASC), reorder existing tetap bisa jalan.
   */
  async remove(ownerUserId: string, bookId: string, chapterId: string): Promise<void> {
    const chapter = await this.findOneForBook(ownerUserId, bookId, chapterId);
    await this.chapterRepo.remove(chapter);
  }

  toResponseDto(chapter: Chapter): ChapterResponseDto {
    return {
      id: chapter.id,
      bookId: chapter.book_id,
      judul: chapter.judul,
      konten: chapter.konten,
      orderIndex: chapter.order_index,
      status: chapter.status,
      contentVersion: chapter.content_version,
      publishedAt: chapter.published_at,
      viewCount: chapter.view_count,
      ratingAverage: Number(chapter.rating_average),
      ratingCount: chapter.rating_count,
      createdAt: chapter.created_at,
      updatedAt: chapter.updated_at,
    };
  }
}
