import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus, BookType } from '../../../entities/book.entity';
import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { CategorySummaryDto } from '../../categories/dto/category-summary.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class BookResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Platform pemilik Book ini (Fase 4, denormalisasi dari Library). Nullable untuk Book lama sebelum backfill §4.4.', nullable: true })
  platformId: string | null;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Library pemilik Book ini' })
  libraryId: string;

  @ApiProperty({ example: 'Kisah di Ujung Senja' })
  judul: string;

  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;

  @ApiPropertyOptional({ example: 'Sebuah kisah tentang penulis yang mengejar mimpinya.', nullable: true })
  sinopsis: string | null;

  @ApiPropertyOptional({ type: GenreResponseDto, nullable: true })
  genre: GenreResponseDto | null;

  @ApiPropertyOptional({ type: CategorySummaryDto, nullable: true })
  category: CategorySummaryDto | null;

  @ApiProperty({ type: TagResponseDto, isArray: true, description: 'Fase 6 — Tag bebas milik Book ini (folksonomi, beda dari Genre/Category kurasi).' })
  tags: TagResponseDto[];

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'draft', enum: ['draft', 'ongoing', 'completed'] })
  status: BookStatus;

  @ApiProperty({ example: 'original', enum: ['original', 'translation', 'adaptation'] })
  bookType: BookType;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Nama penulis asli, relevan kalau bookType bukan "original".' })
  originalAuthor: string | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Waktu Book dipublish (saklar level Book, terpisah dari status di atas) — null kalau belum dipublish.',
  })
  publishedAt: Date | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Override "Maximum Free Chapter" Platform (Fase 5). null = ikut kebijakan Platform.',
  })
  maxFreeChapters: number | null;

  @ApiPropertyOptional({ example: '{{title}} — {{platform}}', nullable: true, description: 'Template override title SEO Book.' })
  seoTitle: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}} di {{platform}}.', nullable: true, description: 'Template override description SEO Book.' })
  seoDescription: string | null;

  @ApiPropertyOptional({ example: '{{title}}', nullable: true, description: 'Template override H1 SEO Book.' })
  seoH1: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}}', nullable: true, description: 'Template override og:title SEO Book.' })
  seoOgTitle: string | null;

  @ApiPropertyOptional({ example: 'Baca cerita lengkap {{title}} di {{platform}}.', nullable: true, description: 'Template override og:description SEO Book.' })
  seoOgDescription: string | null;

  @ApiPropertyOptional({ example: 'book', enum: ['website', 'book', 'profile'], nullable: true, description: 'Override og:type SEO Book.' })
  seoOgType: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Novel', nullable: true, description: 'Prefix SEO Book.' })
  seoPrefix: string | null;

  @ApiPropertyOptional({ example: 'Bahasa Indonesia', nullable: true, description: 'Suffix SEO Book.' })
  seoSuffix: string | null;

  @ApiProperty({ example: 1234, description: 'Fase 7 — total dibaca (SUM view_count semua Chapter Book ini), info read-only untuk penulis pantau performa.' })
  viewCount: number;

  @ApiProperty({ example: 132, description: 'Total komentar pada semua Chapter Book ini, termasuk balasan.' })
  commentCount: number;

  @ApiProperty({ example: 4.5, description: 'Fase 7 — agregat rating Book ini (0 kalau belum ada rating). Sumbernya ikut ratingMode Platform.' })
  ratingAverage: number;

  @ApiProperty({ example: 12, description: 'Fase 7 — jumlah rating yang membentuk ratingAverage di atas.' })
  ratingCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
