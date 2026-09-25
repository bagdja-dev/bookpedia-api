import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus, BookType } from '../../../entities/book.entity';
import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { CategorySummaryDto } from '../../categories/dto/category-summary.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CollectionBookLibrarySummaryDto {
  @ApiProperty({ example: 'Kisah Senja' })
  nama: string;

  @ApiProperty({ example: 'kisah-senja' })
  slug: string;
}

export class CollectionBookDetailDto {
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

  @ApiProperty({ type: TagResponseDto, isArray: true })
  tags: TagResponseDto[];

  @ApiPropertyOptional({ example: null, nullable: true })
  series: { id: string; nama: string } | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  status: BookStatus;

  @ApiPropertyOptional({ example: 'Bab 12: Jalan Pulang', nullable: true })
  latestChapterTitle: string | null;

  @ApiProperty({ example: 'original', enum: ['original', 'translation', 'adaptation'] })
  bookType: BookType;

  @ApiPropertyOptional({ example: null, nullable: true })
  originalAuthor: string | null;

  @ApiProperty({ type: CollectionBookLibrarySummaryDto })
  library: CollectionBookLibrarySummaryDto;

  @ApiProperty({ example: 1234 })
  viewCount: number;

  @ApiProperty({ example: 4.5 })
  ratingAverage: number;

  @ApiProperty({ example: 12 })
  ratingCount: number;

  @ApiProperty({ example: 89 })
  likeCount: number;

  @ApiProperty({ example: 512 })
  uniqueReaderCount: number;

  @ApiProperty({ example: 132 })
  commentCount: number;
}

export class CollectionBookItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  collectionId: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  bookId: string;

  @ApiProperty({ example: true })
  notifyOnAuthorUpdate: boolean;

  @ApiPropertyOptional({ example: 'Catatan pribadi', nullable: true })
  note: string | null;

  @ApiProperty({ example: 'saved', enum: ['saved', 'want_to_read', 'reading', 'finished'] })
  status: 'saved' | 'want_to_read' | 'reading' | 'finished';

  @ApiProperty({ example: '2026-09-25T12:00:00.000Z' })
  addedAt: Date;

  @ApiProperty({ type: CollectionBookDetailDto })
  book: CollectionBookDetailDto;
}
