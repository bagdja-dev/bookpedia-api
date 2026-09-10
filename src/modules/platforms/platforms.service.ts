import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Genre } from '../../entities/genre.entity';
import { Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformResponseDto } from './dto/platform-response.dto';

/**
 * Genre default yang di-copy ke Platform baru (§4.1, 10 Sep 2026) — sama
 * persis 11 genre seed awal MVP (lihat
 * supabase/migrations/20260908030000_genres.sql). Tanpa auto-seed ini,
 * Platform baru lahir dengan 0 genre (dropdown Book kosong) karena genre
 * sekarang di-scope per-Platform, bukan global lagi — gap yang ditemukan
 * saat desain Fase 4, belum disebut eksplisit di execution-plan.md.
 */
const DEFAULT_GENRES: ReadonlyArray<{ nama: string; slug: string }> = [
  { nama: 'Aksi', slug: 'aksi' },
  { nama: 'Drama', slug: 'drama' },
  { nama: 'Fantasi', slug: 'fantasi' },
  { nama: 'Fiksi Ilmiah', slug: 'fiksi-ilmiah' },
  { nama: 'Horor', slug: 'horor' },
  { nama: 'Komedi', slug: 'komedi' },
  { nama: 'Misteri', slug: 'misteri' },
  { nama: 'Non-Fiksi', slug: 'non-fiksi' },
  { nama: 'Romance', slug: 'romance' },
  { nama: 'Slice of Life', slug: 'slice-of-life' },
  { nama: 'Thriller', slug: 'thriller' },
];

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(PlatformStaff)
    private readonly platformStaffRepo: Repository<PlatformStaff>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Owner (org tunggal pemilik client_app Novelo) lihat SEMUA Platform,
   * org-wide. Staff cuma lihat Platform yang dia punya row aktif di
   * `platform_staff`. Dipanggil controller dengan `isOwner` dari
   * `request.platformAccess` (di-set PlatformAccessGuard).
   */
  async findMine(userId: string, isOwner: boolean): Promise<Platform[]> {
    if (isOwner) {
      return this.platformRepo.find({ order: { created_at: 'ASC' } });
    }

    const staffRows = await this.platformStaffRepo.find({ where: { user_id: userId, is_active: true } });
    const platformIds = staffRows.map((row) => row.platform_id);
    if (platformIds.length === 0) return [];

    return this.platformRepo.find({ where: { id: In(platformIds) }, order: { created_at: 'ASC' } });
  }

  async findById(id: string): Promise<Platform | null> {
    return this.platformRepo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Platform | null> {
    return this.platformRepo.findOne({ where: { slug } });
  }

  /**
   * Dipakai resolusi custom domain publik (GET /public/platforms/resolve) —
   * cuma domain yang SUDAH lolos verifikasi DNS TXT (`domain_verified_at`
   * terisi) yang boleh di-resolve, persis pola `markets.resolveDomain()`.
   */
  async findByVerifiedDomain(domain: string): Promise<Platform | null> {
    const platform = await this.platformRepo.findOne({ where: { domain } });
    if (!platform || !platform.domain_verified_at) return null;
    return platform;
  }

  /**
   * Dipakai LibrariesService.create() untuk resolve+validasi `platformId`
   * dari client — 404 kalau tidak ada ATAU tidak aktif (Platform nonaktif
   * tidak boleh menerima Library baru).
   */
  async getActivePlatformOrThrow(id: string): Promise<Platform> {
    const platform = await this.findById(id);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
  }

  /**
   * Varian by-slug dari `getActivePlatformOrThrow()` — dipakai
   * `LibrariesService.create()` (§4.2, 11 Sep 2026, koreksi desain): client
   * (browser, belum tentu Owner/Staff platform manapun) tidak pernah punya
   * akses ke UUID Platform (endpoint publik sengaja tidak expose `id`), jadi
   * `POST /libraries` menerima `platformSlug`, bukan `platformId`.
   */
  async getActivePlatformBySlugOrThrow(slug: string): Promise<Platform> {
    const platform = await this.findBySlug(slug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return platform;
  }

  /**
   * Buat Platform baru + auto-seed genre default dalam SATU transaction
   * (lihat DEFAULT_GENRES di atas) — pola transaction sama seperti
   * ChaptersService.reorder().
   */
  async create(dto: CreatePlatformDto): Promise<Platform> {
    const existingSlug = await this.platformRepo.findOne({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A platform with this slug already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const platformRepo = manager.getRepository(Platform);
      const genreRepo = manager.getRepository(Genre);

      const platform = platformRepo.create({
        nama: dto.nama,
        slug: dto.slug,
        logo_url: dto.logoUrl ?? null,
        favicon_url: dto.faviconUrl ?? null,
        colors: dto.colors,
        lock_studio: dto.lockStudio ?? false,
        renderer_key: dto.rendererKey ?? 'reader',
      });
      const saved = await platformRepo.save(platform);

      const genres = DEFAULT_GENRES.map((g) =>
        genreRepo.create({ platform_id: saved.id, nama: g.nama, slug: g.slug }),
      );
      await genreRepo.save(genres);

      return saved;
    });
  }

  async update(id: string, dto: UpdatePlatformDto): Promise<Platform> {
    const platform = await this.findById(id);
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    if (dto.nama !== undefined) platform.nama = dto.nama;
    if (dto.slug !== undefined && dto.slug !== platform.slug) {
      const existingSlug = await this.platformRepo.findOne({ where: { slug: dto.slug } });
      if (existingSlug) {
        throw new ConflictException('A platform with this slug already exists');
      }
      platform.slug = dto.slug;
    }
    if (dto.logoUrl !== undefined) platform.logo_url = dto.logoUrl;
    if (dto.faviconUrl !== undefined) platform.favicon_url = dto.faviconUrl;
    if (dto.colors !== undefined) platform.colors = dto.colors;
    if (dto.lockStudio !== undefined) platform.lock_studio = dto.lockStudio;
    if (dto.rendererKey !== undefined) platform.renderer_key = dto.rendererKey;
    if (dto.isActive !== undefined) platform.is_active = dto.isActive;
    if (dto.domain !== undefined && dto.domain !== platform.domain) {
      const existingDomain = await this.platformRepo.findOne({ where: { domain: dto.domain } });
      if (existingDomain) {
        throw new ConflictException('A platform with this domain already exists');
      }
      platform.domain = dto.domain;
    }

    return this.platformRepo.save(platform);
  }

  toResponseDto(platform: Platform): PlatformResponseDto {
    return {
      id: platform.id,
      nama: platform.nama,
      slug: platform.slug,
      logoUrl: platform.logo_url,
      faviconUrl: platform.favicon_url,
      colors: platform.colors,
      lockStudio: platform.lock_studio,
      rendererKey: platform.renderer_key,
      domain: platform.domain,
      domainVerifiedAt: platform.domain_verified_at,
      isActive: platform.is_active,
      createdAt: platform.created_at,
      updatedAt: platform.updated_at,
    };
  }
}
