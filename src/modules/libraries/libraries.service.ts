import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Library } from '../../entities/library.entity';
import { PlatformsService } from '../platforms/platforms.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { LibraryResponseDto } from './dto/library-response.dto';

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly platformsService: PlatformsService,
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
    // Fase 4 (§4.1, 10 Sep 2026; koreksi §4.2, 11 Sep 2026): platformSlug
    // sekarang wajib dari client, resolusi via body eksplisit (BUKAN Host
    // header) — lihat plan/bookpedia/execution-plan.md §4.1/§4.2 (keputusan
    // resolusi Platform). Slug, bukan UUID — lihat doc-comment
    // CreateLibraryDto.platformSlug untuk alasan lengkap.
    const platform = await this.platformsService.getActivePlatformBySlugOrThrow(dto.platformSlug);

    // lockStudio (gantinya platform_config.lockStudio lama, sekarang
    // platforms.lock_studio milik Platform ini): kalau true, TIDAK ADA
    // jalur lewat API untuk bikin Library baru di Platform ini —
    // satu-satunya cara adalah insert manual langsung ke DB oleh tim
    // Bagdja. Sengaja TIDAK ada pengecualian/allowlist di sini (dikonfirmasi
    // eksplisit user, bukan "daftar user yang di-approve lalu tetap boleh
    // lewat form").
    if (platform.lock_studio) {
      throw new ForbiddenException(
        'Pendaftaran penulis baru sedang ditutup sementara. Hubungi admin platform.',
      );
    }

    // MVP: satu Library = satu penulis (solo), lihat overview.md §3 & §4.1 —
    // user yang sudah punya Library tidak boleh membuat lagi.
    const existingForOwner = await this.findLibraryByOwner(ownerUserId);
    if (existingForOwner) {
      throw new ConflictException('User already owns a Library');
    }

    // Cek slug GLOBAL (bukan per-platform) — constraint UNIQUE(slug) lama di
    // DB masih hidup sampai §4.4 (lihat migration 20260910010000), jadi slug
    // masih harus unik lintas-Platform untuk sekarang walau index composite
    // baru sudah ada.
    const existingSlug = await this.libraryRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A library with this slug already exists');
    }

    const library = this.libraryRepo.create({
      platform_id: platform.id,
      owner_user_id: ownerUserId,
      nama: dto.nama,
      slug: dto.slug,
      deskripsi: dto.deskripsi ?? null,
      cover_url: dto.coverUrl ?? null,
    });

    return this.libraryRepo.save(library);
  }

  async update(ownerUserId: string, dto: UpdateLibraryDto): Promise<Library> {
    const library = await this.findLibraryByOwner(ownerUserId);
    if (!library) {
      throw new NotFoundException('User belum punya Library');
    }

    if (dto.nama !== undefined) library.nama = dto.nama;
    if (dto.deskripsi !== undefined) library.deskripsi = dto.deskripsi;
    if (dto.coverUrl !== undefined) library.cover_url = dto.coverUrl;
    if (dto.seoH1 !== undefined) library.seo_h1 = dto.seoH1;
    if (dto.seoTitle !== undefined) library.seo_title = dto.seoTitle;
    if (dto.seoDescription !== undefined) library.seo_description = dto.seoDescription;
    if (dto.seoOgTitle !== undefined) library.seo_og_title = dto.seoOgTitle;
    if (dto.seoOgDescription !== undefined) library.seo_og_description = dto.seoOgDescription;
    if (dto.seoOgType !== undefined) library.seo_og_type = dto.seoOgType ?? 'profile';
    if (dto.seoPrefix !== undefined) library.seo_prefix = dto.seoPrefix;
    if (dto.seoSuffix !== undefined) library.seo_suffix = dto.seoSuffix;

    return this.libraryRepo.save(library);
  }

  toResponseDto(library: Library): LibraryResponseDto {
    return {
      id: library.id,
      platformId: library.platform_id,
      ownerUserId: library.owner_user_id,
      nama: library.nama,
      slug: library.slug,
      deskripsi: library.deskripsi,
      coverUrl: library.cover_url,
      seoTitle: library.seo_title,
      seoDescription: library.seo_description,
      seoH1: library.seo_h1,
      seoOgTitle: library.seo_og_title,
      seoOgDescription: library.seo_og_description,
      seoOgType: library.seo_og_type,
      seoPrefix: library.seo_prefix,
      seoSuffix: library.seo_suffix,
      createdAt: library.created_at,
      updatedAt: library.updated_at,
    };
  }
}
