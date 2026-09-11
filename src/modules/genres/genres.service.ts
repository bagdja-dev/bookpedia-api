import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Genre } from '../../entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenreResponseDto } from './dto/genre-response.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  /**
   * Daftar genre milik satu Platform, urut `nama` ASC — dipakai Studio (form
   * Book) & Reader (filter katalog). Fase 4 (§4.1, 10 Sep 2026): genre
   * di-scope per-Platform, bukan global lagi.
   */
  async findAllByPlatform(platformId: string): Promise<Genre[]> {
    return this.genreRepo.find({ where: { platform_id: platformId }, order: { nama: 'ASC' } });
  }

  /**
   * Dipakai BooksService untuk validasi `genreId` saat create/update Book —
   * return entity penuh (bukan cuma boolean) supaya `platform_id`-nya bisa
   * dicek sekaligus (genre WAJIB dari Platform yang sama dengan Book).
   */
  async findById(id: string): Promise<Genre | null> {
    return this.genreRepo.findOne({ where: { id } });
  }

  /**
   * Scoped lookup — 404 kalau Genre tidak ada ATAU bukan milik `platformId`
   * (dicek eksplisit, pola sama `CategoriesService.findEntityOrThrow`).
   */
  private async findEntityOrThrow(platformId: string, id: string): Promise<Genre> {
    const genre = await this.genreRepo.findOne({ where: { id, platform_id: platformId } });
    if (!genre) throw new NotFoundException('Genre not found');
    return genre;
  }

  async create(platformId: string, dto: CreateGenreDto): Promise<GenreResponseDto> {
    const existingSlug = await this.genreRepo.findOne({ where: { platform_id: platformId, slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A genre with this slug already exists in this platform');
    }
    const existingNama = await this.genreRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
    if (existingNama) {
      throw new ConflictException('A genre with this name already exists in this platform');
    }

    const genre = this.genreRepo.create({ platform_id: platformId, nama: dto.nama, slug: dto.slug });
    const saved = await this.genreRepo.save(genre);
    return this.toResponseDto(saved);
  }

  async update(platformId: string, id: string, dto: UpdateGenreDto): Promise<GenreResponseDto> {
    const genre = await this.findEntityOrThrow(platformId, id);

    if (dto.nama !== undefined && dto.nama !== genre.nama) {
      const existing = await this.genreRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
      if (existing) throw new ConflictException('A genre with this name already exists in this platform');
      genre.nama = dto.nama;
    }
    if (dto.slug !== undefined && dto.slug !== genre.slug) {
      const existing = await this.genreRepo.findOne({ where: { platform_id: platformId, slug: dto.slug } });
      if (existing) throw new ConflictException('A genre with this slug already exists in this platform');
      genre.slug = dto.slug;
    }

    await this.genreRepo.save(genre);
    return this.toResponseDto(genre);
  }

  /**
   * Hapus Genre — aman terhadap Book (FK `books.genre_id` ON DELETE SET
   * NULL, lihat `book.entity.ts`) dan Category (pivot `genre_categories` ON
   * DELETE CASCADE, lihat `genre-category.entity.ts`), jadi tidak perlu
   * guard manual "masih dipakai" sebelum hapus.
   */
  async remove(platformId: string, id: string): Promise<DeletedResponseDto> {
    const genre = await this.findEntityOrThrow(platformId, id);
    await this.genreRepo.remove(genre);
    return { deleted: true };
  }

  toResponseDto(genre: Genre): GenreResponseDto {
    return {
      id: genre.id,
      platformId: genre.platform_id,
      nama: genre.nama,
      slug: genre.slug,
    };
  }
}
