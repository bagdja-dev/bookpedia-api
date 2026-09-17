import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadingProgressListItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  bookId: string;

  @ApiProperty({ example: 'Kisah di Ujung Senja' })
  bookJudul: string;

  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  bookSlug: string;

  @ApiPropertyOptional({ nullable: true, example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg' })
  bookCoverUrl: string | null;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  lastChapterId: string;

  @ApiProperty({ example: 2, description: 'order_index Chapter posisi baca terakhir' })
  lastChapterOrderIndex: number;

  @ApiProperty({ example: 'Bab 2: Pertemuan' })
  lastChapterJudul: string;

  @ApiProperty({ example: false, description: 'Apakah Book ini ditampilkan pada Reading List profil publik user.' })
  isPublic: boolean;

  @ApiProperty()
  updatedAt: Date;
}
