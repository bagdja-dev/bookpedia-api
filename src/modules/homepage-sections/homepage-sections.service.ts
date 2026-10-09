import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { HAS_PUBLISHED_CHAPTER_SQL, IS_BOOK_PUBLISHED_SQL } from '../../common/book-visibility.sql';
import { Book } from '../../entities/book.entity';
import { HomepageSectionBook } from '../../entities/homepage-section-book.entity';
import { Library } from '../../entities/library.entity';
import { Platform } from '../../entities/platform.entity';
import { HomepageSectionBookDto } from './dto/homepage-section-book.dto';

/**
 * Isi section homepage mode "manual" — Book dipilih satu per satu oleh Owner/Staff
 * Platform. Pola sama `PromotionsService` (replace-all dalam satu transaksi, urutan
 * array = urutan tampil, hanya Book published di Platform yang sama).
 */
@Injectable()
export class HomepageSectionsService {
  constructor(
    @InjectRepository(HomepageSectionBook)
    private readonly sectionBookRepo: Repository<HomepageSectionBook>,
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly dataSource: DataSource,
  ) {}

  async listBooks(platformId: string, sectionId: string): Promise<HomepageSectionBookDto[]> {
    await this.findSectionOrThrow(platformId, sectionId);
    const rows = await this.sectionBookRepo.find({
      where: { platform_id: platformId, section_id: sectionId },
      order: { position: 'ASC' },
    });
    return this.toDtos(platformId, rows.map((row) => row.book_id));
  }

  async replaceBooks(platformId: string, sectionId: string, bookIds: string[]): Promise<HomepageSectionBookDto[]> {
    await this.findSectionOrThrow(platformId, sectionId);
    const uniqueIds = [...new Set(bookIds)];

    if (uniqueIds.length > 0) {
      // Semua Book harus milik Platform ini. Yang BARU ditambahkan wajib published; yang sudah
      // ada di list boleh tetap disimpan walau sempat di-unpublish (tetap tersembunyi di homepage),
      // supaya satu Book yang di-unpublish tidak mengunci perubahan lain di section ini.
      const existing = await this.sectionBookRepo.find({ where: { platform_id: platformId, section_id: sectionId } });
      const existingIds = new Set(existing.map((row) => row.book_id));
      const newIds = uniqueIds.filter((id) => !existingIds.has(id));

      const inPlatform = await this.bookRepo.count({ where: { id: In(uniqueIds), platform_id: platformId } });
      if (inPlatform !== uniqueIds.length) {
        throw new BadRequestException('Semua Book harus berada di Platform ini.');
      }
      if (newIds.length > 0 && (await this.publishedBooksQuery(platformId, newIds).getCount()) !== newIds.length) {
        throw new BadRequestException('Book yang ditambahkan harus sudah published (minimal 1 Chapter published).');
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(HomepageSectionBook);
      await repo.delete({ platform_id: platformId, section_id: sectionId });
      if (uniqueIds.length > 0) {
        await repo.save(uniqueIds.map((bookId, position) => repo.create({
          platform_id: platformId,
          section_id: sectionId,
          book_id: bookId,
          position,
        })));
      }
    });

    return this.listBooks(platformId, sectionId);
  }

  /** Section harus sudah tersimpan di `platforms.homepage_sections` (simpan homepage dulu). */
  private async findSectionOrThrow(platformId: string, sectionId: string) {
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform not found');
    const section = (platform.homepage_sections ?? []).find((item) => item.id === sectionId);
    if (!section) {
      throw new NotFoundException('Section homepage tidak ditemukan — simpan pengaturan homepage terlebih dulu.');
    }
    return section;
  }

  private publishedBooksQuery(platformId: string, ids: string[]) {
    return this.bookRepo
      .createQueryBuilder('book')
      .where('book.id IN (:...ids)', { ids })
      .andWhere('book.platform_id = :platformId', { platformId })
      .andWhere(IS_BOOK_PUBLISHED_SQL)
      .andWhere(HAS_PUBLISHED_CHAPTER_SQL);
  }

  private async toDtos(platformId: string, bookIds: string[]): Promise<HomepageSectionBookDto[]> {
    if (bookIds.length === 0) return [];
    const [books, visible] = await Promise.all([
      this.bookRepo.find({ where: { id: In(bookIds) } }),
      this.publishedBooksQuery(platformId, bookIds).select('book.id', 'id').getRawMany<{ id: string }>(),
    ]);
    const visibleIds = new Set(visible.map((row) => row.id));
    const bookById = new Map(books.map((book) => [book.id, book]));
    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const libraries = libraryIds.length ? await this.libraryRepo.find({ where: { id: In(libraryIds) } }) : [];
    const libraryById = new Map(libraries.map((library) => [library.id, library]));

    return bookIds
      .map((id) => bookById.get(id))
      .filter((book): book is Book => !!book)
      .map((book) => ({
        id: book.id,
        judul: book.judul,
        slug: book.slug,
        coverUrl: book.cover_url,
        libraryNama: libraryById.get(book.library_id)?.nama ?? '',
        isVisible: visibleIds.has(book.id),
      }));
  }
}
