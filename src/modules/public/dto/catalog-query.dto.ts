import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type CatalogSearchBy = 'judul' | 'library' | 'originalAuthor';

export class CatalogQueryDto {
  @ApiPropertyOptional({ example: 'senja', description: 'Teks pencarian (ILIKE, case-insensitive) — field yang dicocokkan ditentukan `searchBy`' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'judul',
    enum: ['judul', 'library', 'originalAuthor'],
    default: 'judul',
    description:
      'Field yang dicocokkan `search`: judul (default) / library (nama Library-penulis) / originalAuthor (nama penulis asli, relevan utk terjemahan/adaptasi)',
  })
  @IsOptional()
  @IsIn(['judul', 'library', 'originalAuthor'])
  searchBy?: CatalogSearchBy;

  @ApiPropertyOptional({
    example: 'fantasi',
    description: 'Filter genre by slug (dari GET /public/genres, exact match) — BUKAN free text lagi',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    example: 'fiksi',
    description:
      'Filter by Category slug (dari GET /public/platforms/:platformSlug/categories) — expand ke semua Genre anggota Category ini (book.genre_id IN (...)). Bisa dikombinasikan dengan `genre` (keduanya di-AND-kan).',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'petualangan,slow-burn',
    description:
      'Fase 6 — filter Tag by slug (dari GET /public/platforms/:platformSlug/tags, exact match). Boleh lebih dari satu, dipisah koma — Book harus punya SEMUA tag yang disebut (AND, bukan salah satu). Bisa dikombinasikan dengan genre/category (semua di-AND-kan).',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
