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

  /** Daftar semua genre, urut `nama` ASC — dipakai Studio (form Book) & Reader (filter katalog). */
  async findAll(): Promise<Genre[]> {
    return this.genreRepo.find({ order: { nama: 'ASC' } });
  }

  /** Dipakai BooksService untuk validasi `genreId` saat create/update Book. */
  async existsById(id: string): Promise<boolean> {
    const count = await this.genreRepo.count({ where: { id } });
    return count > 0;
  }

  toResponseDto(genre: Genre): GenreResponseDto {
    return {
      id: genre.id,
      nama: genre.nama,
      slug: genre.slug,
    };
  }
}
