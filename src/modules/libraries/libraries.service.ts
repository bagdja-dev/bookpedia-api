import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Library } from '../../entities/library.entity';
import { CreateLibraryDto } from './dto/create-library.dto';
import { LibraryResponseDto } from './dto/library-response.dto';

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
  ) {}

  /**
   * Reusable lookup dipakai module lain (Fase 1+) untuk resolve `library_id`
   * milik user login sebelum scoping query Book/Chapter — cukup sebagai
   * helper service method di Fase 0, belum perlu guard generik terpisah
   * (lihat execution-plan.md Fase 0, poin "Ownership guard dasar").
   */
  async findLibraryByOwner(ownerUserId: string): Promise<Library | null> {
    return this.libraryRepo.findOne({ where: { owner_user_id: ownerUserId } });
  }

  async create(ownerUserId: string, dto: CreateLibraryDto): Promise<Library> {
    // MVP: satu Library = satu penulis (solo), lihat overview.md §3 & §4.1 —
    // user yang sudah punya Library tidak boleh membuat lagi.
    const existingForOwner = await this.findLibraryByOwner(ownerUserId);
    if (existingForOwner) {
      throw new ConflictException('User already owns a Library');
    }

    const existingSlug = await this.libraryRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A library with this slug already exists');
    }

    const library = this.libraryRepo.create({
      owner_user_id: ownerUserId,
      nama: dto.nama,
      slug: dto.slug,
      deskripsi: dto.deskripsi ?? null,
      cover_url: dto.coverUrl ?? null,
    });

    return this.libraryRepo.save(library);
  }

  toResponseDto(library: Library): LibraryResponseDto {
    return {
      id: library.id,
      ownerUserId: library.owner_user_id,
      nama: library.nama,
      slug: library.slug,
      deskripsi: library.deskripsi,
      coverUrl: library.cover_url,
      createdAt: library.created_at,
      updatedAt: library.updated_at,
    };
  }
}
