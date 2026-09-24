import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Book } from '../../entities/book.entity';
import { BookSeries } from '../../entities/book-series.entity';
import { Library } from '../../entities/library.entity';
import { Series } from '../../entities/series.entity';
import { LibrariesService } from '../libraries/libraries.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { SeriesBookDto, SeriesDetailDto } from './dto/series-detail.dto';

const MAX_SERIES_BOOKS = 50;

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(BookSeries)
    private readonly bookSeriesRepo: Repository<BookSeries>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly librariesService: LibrariesService,
    private readonly dataSource: DataSource,
  ) {}

  async listForOwner(ownerUserId: string): Promise<Array<{ id: string; nama: string; bookCount: number; createdAt: string; updatedAt: string }>> {
    const platformId = await this.getPlatformIdForOwner(ownerUserId);
    const series = await this.seriesRepo.find({
      where: { platform_id: platformId },
      order: { created_at: 'DESC' },
    });

    if (series.length === 0) return [];

    const counts = await this.bookSeriesRepo
      .createQueryBuilder('bookSeries')
      .select('bookSeries.series_id', 'seriesId')
      .addSelect('COUNT(*)', 'bookCount')
      .where('bookSeries.series_id IN (:...seriesIds)', { seriesIds: series.map((item) => item.id) })
      .groupBy('bookSeries.series_id')
      .getRawMany();

    const countBySeries = new Map<string, number>(counts.map((item) => [item.seriesId, Number(item.bookCount)]));

    return series.map((item) => ({
      id: item.id,
      nama: item.nama,
      bookCount: countBySeries.get(item.id) ?? 0,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }));
  }

  async createForOwner(ownerUserId: string, dto: CreateSeriesDto): Promise<SeriesDetailDto> {
    const platformId = await this.getPlatformIdForOwner(ownerUserId);
    const nama = dto.nama.trim();

    if (!nama) {
      throw new BadRequestException('Nama series tidak boleh kosong.');
    }

    const series = this.seriesRepo.create({ platform_id: platformId, nama });
    const saved = await this.seriesRepo.save(series);

    if (dto.bookIds && dto.bookIds.length > 0) {
      await this.replaceBookLinks(platformId, saved.id, dto.bookIds);
    }

    return this.getForOwner(ownerUserId, saved.id);
  }

  async getForOwner(ownerUserId: string, seriesId: string): Promise<SeriesDetailDto> {
    const platformId = await this.getPlatformIdForOwner(ownerUserId);
    const series = await this.seriesRepo.findOne({ where: { id: seriesId, platform_id: platformId } });
    if (!series) {
      throw new NotFoundException('Series tidak ditemukan');
    }

    const bookLinks = await this.bookSeriesRepo.find({
      where: { series_id: series.id },
      order: { position: 'ASC' },
    });

    const books = await this.loadBooksForLinks(bookLinks);

    return {
      id: series.id,
      nama: series.nama,
      platformId: series.platform_id,
      bookCount: books.length,
      books,
      createdAt: series.created_at.toISOString(),
      updatedAt: series.updated_at.toISOString(),
    };
  }

  async updateForOwner(ownerUserId: string, seriesId: string, dto: UpdateSeriesDto): Promise<SeriesDetailDto> {
    const platformId = await this.getPlatformIdForOwner(ownerUserId);
    const series = await this.seriesRepo.findOne({ where: { id: seriesId, platform_id: platformId } });
    if (!series) {
      throw new NotFoundException('Series tidak ditemukan');
    }

    if (dto.nama !== undefined) {
      const trimNama = dto.nama.trim();
      if (!trimNama) {
        throw new BadRequestException('Nama series tidak boleh kosong.');
      }
      series.nama = trimNama;
      await this.seriesRepo.save(series);
    }

    if (dto.bookIds !== undefined) {
      await this.replaceBookLinks(platformId, series.id, dto.bookIds);
    }

    return this.getForOwner(ownerUserId, series.id);
  }

  async removeForOwner(ownerUserId: string, seriesId: string): Promise<void> {
    const platformId = await this.getPlatformIdForOwner(ownerUserId);
    const series = await this.seriesRepo.findOne({ where: { id: seriesId, platform_id: platformId } });
    if (!series) {
      throw new NotFoundException('Series tidak ditemukan');
    }

    await this.seriesRepo.remove(series);
  }

  private async getPlatformIdForOwner(ownerUserId: string): Promise<string> {
    const library = await this.librariesService.findLibraryByOwner(ownerUserId);
    if (!library) {
      throw new NotFoundException('Anda belum memiliki Library untuk mengelola series.');
    }
    if (!library.platform_id) {
      throw new BadRequestException('Library Anda belum terhubung ke Platform aktif.');
    }
    return library.platform_id;
  }

  private async replaceBookLinks(platformId: string, seriesId: string, bookIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(bookIds.filter(Boolean))];
    if (uniqueIds.length > MAX_SERIES_BOOKS) {
      throw new BadRequestException(`Maksimal ${MAX_SERIES_BOOKS} Book per Series.`);
    }

    if (uniqueIds.length > 0) {
      const validCount = await this.bookRepo
        .createQueryBuilder('book')
        .where('book.id IN (:...uniqueIds)', { uniqueIds })
        .andWhere('book.platform_id = :platformId', { platformId })
        .getCount();

      if (validCount !== uniqueIds.length) {
        throw new BadRequestException('Semua Book pada series harus berasal dari Platform Studio yang sama.');
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BookSeries);
      await repo.delete({ series_id: seriesId });
      if (uniqueIds.length > 0) {
        await repo.save(
          uniqueIds.map((bookId, index) =>
            repo.create({
              series_id: seriesId,
              book_id: bookId,
              position: index,
            }),
          ),
        );
      }
    });
  }

  private async loadBooksForLinks(bookLinks: BookSeries[]): Promise<SeriesBookDto[]> {
    if (bookLinks.length === 0) return [];

    const bookIds = bookLinks.map((item) => item.book_id);
    const books = await this.bookRepo.find({ where: { id: In(bookIds) }, relations: ['genre'] });
    const bookMap = new Map(books.map((book) => [book.id, book]));

    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const libraries = libraryIds.length > 0 ? await this.libraryRepo.find({ where: { id: In(libraryIds) } }) : [];
    const libraryMap = new Map(libraries.map((library) => [library.id, library]));

    return bookLinks
      .map((link) => bookMap.get(link.book_id))
      .filter((book): book is Book => !!book)
      .map((book) => ({
        id: book.id,
        judul: book.judul,
        slug: book.slug,
        coverUrl: book.cover_url,
        libraryNama: libraryMap.get(book.library_id)?.nama ?? '',
        publishedAt: book.published_at ? book.published_at.toISOString() : null,
        status: book.status,
      }));
  }
}
