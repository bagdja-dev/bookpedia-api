import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus } from '../../../entities/book.entity';

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

  @ApiPropertyOptional({ example: 'Fantasi', nullable: true })
  genre: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  status: BookStatus;

  @ApiProperty({ type: LibrarySummaryDto })
  library: LibrarySummaryDto;
}
