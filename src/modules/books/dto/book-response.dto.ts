import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BookStatus } from '../../../entities/book.entity';

export class BookResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Library pemilik Book ini' })
  libraryId: string;

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

  @ApiProperty({ example: 'draft', enum: ['draft', 'ongoing', 'completed'] })
  status: BookStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
