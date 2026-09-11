import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Category } from '../../entities/category.entity';
import { Genre } from '../../entities/genre.entity';
import { GenreCategory } from '../../entities/genre-category.entity';
import { GenresService } from '../genres/genres.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AttachGenreDto } from './dto/attach-genre.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategorySummaryDto } from './dto/category-summary.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(GenreCategory)
    private readonly genreCategoryRepo: Repository<GenreCategory>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    private readonly genresService: GenresService,
  ) {}

  /**
   * Scoped lookup — 404 kalau Category tidak ada ATAU bukan milik
   * `platformId` (dicek eksplisit, bukan cuma percaya `:id` dari URL —
   * `PlatformAccessGuard` sudah menjamin user boleh akses `platformId`,
   * tapi belum menjamin `id` Category itu benar-benar milik Platform yang
   * sama, mis. Owner Platform A coba akses id Category milik Platform B).
   */
  private async findEntityOrThrow(platformId: string, id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id, platform_id: platformId } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  /**
   * Dipakai BooksService untuk validasi `categoryId` saat create/update Book
   * — return entity penuh (bukan cuma boolean) supaya `platform_id`-nya bisa
   * dicek sekaligus (category WAJIB dari Platform yang sama dengan Book),
   * pola sama `GenresService.findById`.
   */
  async findById(id: string): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  private async getGenresForCategory(categoryId: string): Promise<Genre[]> {
    const pivots = await this.genreCategoryRepo.find({ where: { category_id: categoryId }, relations: ['genre'] });
    return pivots.map((p) => p.genre).filter((g): g is Genre => !!g);
  }

  /** Batch-fetch genre per Category (satu query IN, bukan N+1 per Category) — pola sama PublicService.toCatalogDtos(). */
  private async toResponseDtos(categories: Category[]): Promise<CategoryResponseDto[]> {
    if (categories.length === 0) return [];

    const categoryIds = categories.map((c) => c.id);
    const pivots = await this.genreCategoryRepo.find({
      where: { category_id: In(categoryIds) },
      relations: ['genre'],
    });

    const genresByCategory = new Map<string, Genre[]>();
    for (const pivot of pivots) {
      if (!pivot.genre) continue;
      const list = genresByCategory.get(pivot.category_id) ?? [];
      list.push(pivot.genre);
      genresByCategory.set(pivot.category_id, list);
    }

    return categories.map((c) => this.toResponseDto(c, genresByCategory.get(c.id) ?? []));
  }

  async findAllByPlatform(platformId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepo.find({ where: { platform_id: platformId }, order: { nama: 'ASC' } });
    return this.toResponseDtos(categories);
  }

  async findOne(platformId: string, id: string): Promise<CategoryResponseDto> {
    const category = await this.findEntityOrThrow(platformId, id);
    const genres = await this.getGenresForCategory(category.id);
    return this.toResponseDto(category, genres);
  }

  async create(platformId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existingSlug = await this.categoryRepo.findOne({ where: { platform_id: platformId, slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('A category with this slug already exists in this platform');
    }
    const existingNama = await this.categoryRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
    if (existingNama) {
      throw new ConflictException('A category with this name already exists in this platform');
    }

    const category = this.categoryRepo.create({ platform_id: platformId, nama: dto.nama, slug: dto.slug });
    const saved = await this.categoryRepo.save(category);
    return this.toResponseDto(saved, []);
  }

  async update(platformId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.findEntityOrThrow(platformId, id);

    if (dto.nama !== undefined && dto.nama !== category.nama) {
      const existing = await this.categoryRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
      if (existing) throw new ConflictException('A category with this name already exists in this platform');
      category.nama = dto.nama;
    }
    if (dto.slug !== undefined && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findOne({ where: { platform_id: platformId, slug: dto.slug } });
      if (existing) throw new ConflictException('A category with this slug already exists in this platform');
      category.slug = dto.slug;
    }

    await this.categoryRepo.save(category);
    const genres = await this.getGenresForCategory(category.id);
    return this.toResponseDto(category, genres);
  }

  async remove(platformId: string, id: string): Promise<DeletedResponseDto> {
    const category = await this.findEntityOrThrow(platformId, id);
    await this.categoryRepo.remove(category);
    return { deleted: true };
  }

  /**
   * Kaitkan Genre EXISTING ke Category ini — TIDAK bikin Genre baru (di
   * luar scope, lihat plan/keputusan). Genre WAJIB dari `platformId` yang
   * sama dengan Category (dicek eksplisit, Postgres tidak bisa enforce ini
   * sebagai constraint lintas-kolom).
   */
  async attachGenre(platformId: string, categoryId: string, dto: AttachGenreDto): Promise<CategoryResponseDto> {
    const category = await this.findEntityOrThrow(platformId, categoryId);

    const genre = await this.genreRepo.findOne({ where: { id: dto.genreId } });
    if (!genre) throw new NotFoundException('Genre not found');
    if (genre.platform_id !== platformId) {
      throw new BadRequestException('Genre bukan milik Platform yang sama dengan Category ini');
    }

    const existing = await this.genreCategoryRepo.findOne({
      where: { genre_id: dto.genreId, category_id: categoryId },
    });
    if (existing) {
      throw new ConflictException('Genre sudah terkait Category ini');
    }

    const pivot = this.genreCategoryRepo.create({ genre_id: dto.genreId, category_id: categoryId });
    await this.genreCategoryRepo.save(pivot);

    const genres = await this.getGenresForCategory(categoryId);
    return this.toResponseDto(category, genres);
  }

  async detachGenre(platformId: string, categoryId: string, genreId: string): Promise<DeletedResponseDto> {
    await this.findEntityOrThrow(platformId, categoryId);

    const pivot = await this.genreCategoryRepo.findOne({ where: { genre_id: genreId, category_id: categoryId } });
    if (!pivot) throw new NotFoundException('Kaitan Genre-Category tidak ditemukan');

    await this.genreCategoryRepo.remove(pivot);
    return { deleted: true };
  }

  toSummaryDto(category: Category): CategorySummaryDto {
    return {
      id: category.id,
      platformId: category.platform_id,
      nama: category.nama,
      slug: category.slug,
    };
  }

  toResponseDto(category: Category, genres: Genre[]): CategoryResponseDto {
    return {
      id: category.id,
      platformId: category.platform_id,
      nama: category.nama,
      slug: category.slug,
      genres: genres.map((g) => this.genresService.toResponseDto(g)),
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }
}
