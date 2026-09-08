import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import type { ChapterStatus } from '../../../entities/chapter.entity';

export class UpdateChapterDto {
  @ApiPropertyOptional({ example: 'Bab 1: Awal Mula (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  judul?: string;

  @ApiPropertyOptional({
    example: '<p>Isi chapter setelah direvisi...</p>',
    description:
      'Kalau dikirim DAN nilainya beda dari konten tersimpan saat ini, content_version naik +1. Kalau sama persis atau tidak dikirim, content_version tidak berubah.',
  })
  @IsOptional()
  @IsString()
  konten?: string;

  @ApiPropertyOptional({
    example: 'published',
    enum: ['draft', 'published'],
    description:
      'draft->published: published_at diisi now(). published->draft (unpublish): published_at di-null-kan lagi. Kalau sama dengan status saat ini, tidak ada efek samping.',
  })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: ChapterStatus;
}
