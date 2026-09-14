import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

import type { RatingMode } from '../../../entities/platform.entity';

export class CreatePlatformDto {
  @ApiProperty({ example: 'Teknobuku', description: 'Nama Platform, tampil di header/tab browser/footer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({
    example: 'teknobuku',
    description: 'Slug unik Platform, lowercase-kebab-case (subdomain default {slug}.bookpedia.bagdja.com)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "teknobuku")',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/favicon.png' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiProperty({
    example: {
      bg: '#fbf6ee',
      surface: '#fffdf8',
      foreground: '#2c2114',
      muted: '#7a6c57',
      border: '#e6d9c3',
      terracotta: '#c1502e',
      terracottaForeground: '#fdf8f0',
      mustard: '#d79a2c',
      olive: '#6b7a4c',
    },
    description: 'JSON color scheme Platform ini',
  })
  @IsObject()
  colors: Record<string, string>;

  @ApiPropertyOptional({ example: false, description: 'Kalau true, POST /libraries ditutup untuk Platform ini. Default false.' })
  @IsOptional()
  @IsBoolean()
  lockStudio?: boolean;

  @ApiPropertyOptional({ example: 'reader', description: "Template reader Platform ini. Default 'reader' (route group (reader)/ yang sudah ada)." })
  @IsOptional()
  @IsString()
  rendererKey?: string;

  @ApiPropertyOptional({
    example: 0,
    description:
      'Jumlah Chapter pertama tiap Book yang bisa dibaca TANPA login. SENTINEL: 0 = SEMUA Chapter di Platform ini gratis (bukan "nol Chapter gratis"). Default 0.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxFreeChapters?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Tampilkan badge status cerita (draft/ongoing/completed) di halaman publik. Default true. Tidak mempengaruhi Studio.',
  })
  @IsOptional()
  @IsBoolean()
  showBookStatus?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Fase 6 — batas jumlah Tag yang boleh dilekatkan ke satu Book. Default 5.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxTagsPerBook?: number;

  @ApiPropertyOptional({ example: true, description: 'Fase 7 — nyala/mati fitur rating Book/Chapter. Default true.' })
  @IsOptional()
  @IsBoolean()
  enableRating?: boolean;

  @ApiPropertyOptional({
    example: 'book',
    enum: ['book', 'chapter'],
    description: 'Fase 7 — grain rating: "book" (satu rating per Book) atau "chapter" (rating terpisah tiap Chapter, diagregasi ke Book saat ditampilkan). Default "book".',
  })
  @IsOptional()
  @IsIn(['book', 'chapter'])
  ratingMode?: RatingMode;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Like di ChapterEngagementBar. Default true.' })
  @IsOptional()
  @IsBoolean()
  enableLike?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Comment (mock) di ChapterEngagementBar. Default true.' })
  @IsOptional()
  @IsBoolean()
  enableComment?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Share di ChapterEngagementBar. Default true.' })
  @IsOptional()
  @IsBoolean()
  enableShare?: boolean;
}
