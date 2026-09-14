import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus, BookType } from '../../../entities/book.entity';
import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { CategorySummaryDto } from '../../categories/dto/category-summary.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { LibrarySummaryDto } from './book-catalog.dto';

export class ChapterListItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Bab 1: Awal Mula' })
  judul: string;

  @ApiProperty({ example: 1, description: 'Urutan tampil Chapter dalam Book (mulai dari 1)' })
  orderIndex: number;

  @ApiPropertyOptional({ nullable: true })
  publishedAt: Date | null;

  @ApiProperty({
    example: true,
    description: 'Fase 5 (SEO) — true kalau Chapter ini bisa dibaca tanpa login. Dipakai reader app untuk badge "Gratis" di daftar Chapter.',
  })
  isFree: boolean;
}

/**
 * Detail Book publik — `chapters` HANYA yang berstatus `published`, urut
 * `orderIndex` ASC. Endpoint pemanggil (/public/books/:slug) sudah
 * memastikan Book ini punya minimal 1 Chapter published (kalau tidak, 404
 * sebelum sampai ke DTO ini).
 */
export class BookDetailDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

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

  @ApiProperty({ type: TagResponseDto, isArray: true, description: 'Fase 6 — Tag bebas milik Book ini.' })
  tags: TagResponseDto[];

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  status: BookStatus;

  @ApiProperty({ example: 'original', enum: ['original', 'translation', 'adaptation'] })
  bookType: BookType;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Nama penulis asli, relevan kalau bookType bukan "original".' })
  originalAuthor: string | null;

  @ApiProperty({ type: LibrarySummaryDto })
  library: LibrarySummaryDto;

  @ApiProperty({ type: ChapterListItemDto, isArray: true })
  chapters: ChapterListItemDto[];
}
