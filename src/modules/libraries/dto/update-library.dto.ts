import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Sengaja TIDAK ada `slug` — slug cuma ditentukan saat create (dipakai di
// URL publik /library/{slug}), konsisten dengan pola UpdateBookDto yang juga
// tidak menerima slug lewat update.
export class UpdateLibraryDto {
  @ApiPropertyOptional({ example: 'Kisah Senja (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({ example: 'Kumpulan cerita fiksi kontemporer terbaru.' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/library/kisah-senja/cover-2.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
