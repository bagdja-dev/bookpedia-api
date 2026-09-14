import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ChapterStatus } from '../../../entities/chapter.entity';

export class ChapterResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Book pemilik Chapter ini' })
  bookId: string;

  @ApiProperty({ example: 'Bab 1: Awal Mula' })
  judul: string;

  @ApiProperty({ example: '<p>Isi chapter dari editor Studio...</p>' })
  konten: string;

  @ApiProperty({ example: 1, description: 'Urutan tampil Chapter dalam Book (mulai dari 1)' })
  orderIndex: number;

  @ApiProperty({ example: 'draft', enum: ['draft', 'published'] })
  status: ChapterStatus;

  @ApiProperty({ example: 1, description: 'Naik +1 tiap kali konten diubah — dipakai anti-drift highlight (Fase 3)' })
  contentVersion: number;

  @ApiPropertyOptional({ nullable: true, description: 'Diisi saat status pindah ke published, null kalau draft' })
  publishedAt: Date | null;

  @ApiProperty({ example: 456, description: 'Fase 7 — total dibaca Chapter ini, info read-only untuk penulis.' })
  viewCount: number;

  @ApiProperty({ example: 4.2, description: 'Fase 7 — rating Chapter ini (0 kalau belum ada rating). Cuma relevan kalau Platform pemiliknya ratingMode="chapter".' })
  ratingAverage: number;

  @ApiProperty({ example: 3, description: 'Fase 7 — jumlah rating Chapter ini.' })
  ratingCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
