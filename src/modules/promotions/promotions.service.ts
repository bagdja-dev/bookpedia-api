import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { HAS_PUBLISHED_CHAPTER_SQL, IS_BOOK_PUBLISHED_SQL } from '../../common/book-visibility.sql';
import { Book } from '../../entities/book.entity';
import { BookPromotion } from '../../entities/book-promotion.entity';
import { Library } from '../../entities/library.entity';
import { BooksService } from '../books/books.service';
import { PromotedBookSummaryDto } from './dto/promoted-book-summary.dto';

const MAX_PROMOTIONS = 10;

/**
 * "Rekomendasi Penulis" — kurasi manual Book APA yang tampil di halaman
 * publik Book MILIK SENDIRI (lihat `BookPromotion` entity untuk konteks
 * lengkap). Sengaja dipisah dari `BooksModule` (bukan ditambah ke
 * `BooksService`) karena ini konsep lintas-Library (`promoted_book_id` bisa
 * Book siapa saja), beda dari kebanyakan method `BooksService` yang
 * scoped ke 1 Library milik owner.
 */
@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(BookPromotion)
    private readonly promotionRepo: Repository<BookPromotion>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly booksService: BooksService,
    private readonly dataSource: DataSource,
  ) {}

  async listForOwner(ownerUserId: string, bookId: string): Promise<PromotedBookSummaryDto[]> {
    // Ownership check — 404 kalau bookId bukan milik user login (pola sama
    // ChaptersService nested route, reuse `BooksService.findOneForOwner`).
    await this.booksService.findOneForOwner(ownerUserId, bookId);

    const promotions = await this.promotionRepo.find({ where: { book_id: bookId }, order: { position: 'ASC' } });
    return this.toSummaryDtos(promotions);
  }

  /**
   * Replace-semua (bukan add/remove terpisah) — konsisten pola
   * `TagsService.replaceBookTags`. Validasi: maks `MAX_PROMOTIONS`, tidak
   * boleh promosikan diri sendiri, HARUS Book lain yang published + punya
   * minimal 1 Chapter published, HARUS di Platform yang sama (Platform
   * beda = website/domain berbeda, tidak masuk akal saling link), tapi
   * BEBAS dari Library manapun di Platform itu (bukan cuma Library sendiri
   * — keputusan produk eksplisit).
   */
  async replaceForOwner(ownerUserId: string, bookId: string, promotedBookIds: string[]): Promise<PromotedBookSummaryDto[]> {
    const book = await this.booksService.findOneForOwner(ownerUserId, bookId);

    const uniqueIds = [...new Set(promotedBookIds)].filter((id) => id !== bookId);
    if (uniqueIds.length > MAX_PROMOTIONS) {
      throw new BadRequestException(`Maksimal ${MAX_PROMOTIONS} Book yang bisa dipromosikan`);
    }

    if (uniqueIds.length > 0) {
      const validCount = await this.bookRepo
        .createQueryBuilder('book')
        .where('book.id IN (:...uniqueIds)', { uniqueIds })
        .andWhere('book.platform_id = :platformId', { platformId: book.platform_id })
        .andWhere(IS_BOOK_PUBLISHED_SQL)
        .andWhere(HAS_PUBLISHED_CHAPTER_SQL)
        .getCount();

      if (validCount !== uniqueIds.length) {
        throw new BadRequestException(
          'Semua Book yang dipromosikan harus sudah published (minimal 1 Chapter published) dan berada di Platform yang sama.',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BookPromotion);
      await repo.delete({ book_id: bookId });
      if (uniqueIds.length > 0) {
        await repo.save(uniqueIds.map((promotedBookId, index) => repo.create({ book_id: bookId, promoted_book_id: promotedBookId, position: index })));
      }
    });

    return this.listForOwner(ownerUserId, bookId);
  }

  private async toSummaryDtos(promotions: BookPromotion[]): Promise<PromotedBookSummaryDto[]> {
    if (promotions.length === 0) return [];

    const bookIds = promotions.map((p) => p.promoted_book_id);
    const books = await this.bookRepo.find({ where: { id: In(bookIds) } });
    const bookById = new Map(books.map((b) => [b.id, b]));

    const libraryIds = [...new Set(books.map((b) => b.library_id))];
    const libraries = libraryIds.length > 0 ? await this.libraryRepo.find({ where: { id: In(libraryIds) } }) : [];
    const libraryById = new Map(libraries.map((l) => [l.id, l]));

    return promotions
      .map((p) => bookById.get(p.promoted_book_id))
      .filter((b): b is Book => !!b)
      .map((b) => ({
        id: b.id,
        judul: b.judul,
        slug: b.slug,
        coverUrl: b.cover_url,
        libraryNama: libraryById.get(b.library_id)?.nama ?? '',
      }));
  }
}
