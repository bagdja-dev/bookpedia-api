import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Genre } from '../../entities/genre.entity';
import { GenreResponseDto } from './dto/genre-response.dto';

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

  toResponseDto(genre: Genre): GenreResponseDto {
    return {
      id: genre.id,
      platformId: genre.platform_id,
      nama: genre.nama,
      slug: genre.slug,
    };
  }
}
