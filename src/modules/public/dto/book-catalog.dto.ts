import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus, BookType } from '../../../entities/book.entity';
import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { CategorySummaryDto } from '../../categories/dto/category-summary.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class LibrarySummaryDto {
  @ApiProperty({ example: 'Kisah Senja' })
  nama: string;

  @ApiProperty({ example: 'kisah-senja' })
  slug: string;
}

/**
 * Bentuk ringkas Book untuk daftar (katalog pusat, profil Library) — dipakai
 * lintas endpoint publik di module ini. HANYA Book dengan minimal 1 Chapter
 * `published` yang boleh muncul dalam bentuk ini (lihat PublicService).
 */
export class BookCatalogDto {
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

  @ApiProperty({ example: 1234, description: 'Fase 7 — total dibaca (SUM view_count semua Chapter Book ini).' })
  viewCount: number;

  @ApiProperty({ example: 4.5, description: 'Fase 7 — agregat rating Book ini (0 kalau belum ada rating). Sumbernya ikut ratingMode Platform.' })
  ratingAverage: number;

  @ApiProperty({ example: 12, description: 'Fase 7 — jumlah rating yang membentuk ratingAverage di atas.' })
  ratingCount: number;

  @ApiProperty({ example: 89, description: 'Fase 8 (susulan, 15 Sep 2026) — total Like (SUM like_count semua Chapter Book ini), ditampilkan juga di card katalog.' })
  likeCount: number;

  @ApiProperty({ example: 132, description: 'Jumlah komentar sungguhan pada semua Chapter published Book ini (termasuk balasan, dihitung dari topic chat tiap Chapter).' })
  commentCount: number;
}
