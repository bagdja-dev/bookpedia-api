import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import type { BookStatus } from '../../../entities/book.entity';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Kisah di Ujung Senja (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  judul?: string;

  @ApiPropertyOptional({ example: 'Sinopsis terbaru setelah direvisi.' })
  @IsOptional()
  @IsString()
  sinopsis?: string;

  @ApiPropertyOptional({ example: 'Fantasi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover-2.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'ongoing', 'completed'])
  status?: BookStatus;
}
