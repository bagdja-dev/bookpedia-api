import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus, BookType } from '../../../entities/book.entity';
import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { CategorySummaryDto } from '../../categories/dto/category-summary.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

/**
 * Info Library untuk halaman detail Book — beda dari `LibrarySummaryDto`
 * (katalog/daftar Book, cuma nama+slug) karena butuh field agregat
 * (avatar, total karya/views/comments) yang HANYA dihitung untuk satu
 * Library per request (lihat `PublicService.getLibraryAggregateStats`) —
 * sengaja tidak digabung ke `LibrarySummaryDto` supaya payload katalog
 * (banyak Book per response) tidak ikut kena N+1 agregat.
 */
export class LibraryDetailSummaryDto {
  @ApiProperty({ example: 'Kisah Senja' })
  nama: string;

  @ApiProperty({ example: 'kisah-senja' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/library/kisah-senja/avatar.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 12, description: 'Total Book published milik Library ini.' })
  totalBooks: number;

  @ApiProperty({ example: 48230, description: 'Total dibaca (SUM viewCount semua Book published) milik Library ini.' })
  totalViews: number;

  @ApiProperty({ example: 1420, description: 'Total komentar (semua Chapter published, semua Book) milik Library ini.' })
  totalComments: number;
}

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

  @ApiProperty({
    example: 4.2,
    description: 'Fase 7 — rating Chapter ini (0 kalau belum ada rating). Cuma relevan/ditampilkan reader app kalau platform.ratingMode="chapter".',
  })
  ratingAverage: number;

  @ApiProperty({ example: 3, description: 'Fase 7 — jumlah rating Chapter ini.' })
  ratingCount: number;
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

  @ApiProperty({ type: LibraryDetailSummaryDto })
  library: LibraryDetailSummaryDto;

  @ApiProperty({ type: ChapterListItemDto, isArray: true })
  chapters: ChapterListItemDto[];

  @ApiProperty({ example: 1234, description: 'Fase 7 — total dibaca (SUM view_count semua Chapter Book ini).' })
  viewCount: number;

  @ApiProperty({ example: 4.5, description: 'Fase 7 — agregat rating Book ini (0 kalau belum ada rating). Sumbernya ikut ratingMode Platform.' })
  ratingAverage: number;

  @ApiProperty({ example: 12, description: 'Fase 7 — jumlah rating yang membentuk ratingAverage di atas.' })
  ratingCount: number;

  @ApiProperty({ example: 89, description: 'Fase 8 — total Like (SUM like_count semua Chapter Book ini).' })
  likeCount: number;

  @ApiProperty({ example: 132, description: 'Jumlah komentar sungguhan pada semua Chapter published Book ini (termasuk balasan, dihitung dari topic chat tiap Chapter).' })
  commentCount: number;
}
