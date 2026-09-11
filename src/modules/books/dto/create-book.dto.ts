import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

import type { BookType } from '../../../entities/book.entity';

export class CreateBookDto {
  @ApiProperty({ example: 'Kisah di Ujung Senja', description: 'Judul Book' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  judul: string;

  @ApiProperty({
    example: 'kisah-di-ujung-senja',
    description:
      'Slug unik GLOBAL lintas platform (bukan per-library), lowercase-kebab-case — dipakai di URL publik /book/{slug} mulai Fase 2',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "kisah-di-ujung-senja")',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Sebuah kisah tentang penulis yang mengejar mimpinya.' })
  @IsOptional()
  @IsString()
  sinopsis?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID genre dari GET /public/genres. 400 kalau tidak match genre manapun.',
  })
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'ID Category dari GET /public/platforms/{slug}/categories — independen dari genreId (tidak divalidasi harus "cocok"). 400 kalau tidak match Category manapun.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @ApiPropertyOptional({
    example: 'original',
    enum: ['original', 'translation', 'adaptation'],
    description: 'original (default) / translation / adaptation — Book terjemahan/adaptasi karya orang lain.',
  })
  @IsOptional()
  @IsIn(['original', 'translation', 'adaptation'])
  bookType?: BookType;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Nama penulis asli — relevan kalau bookType bukan "original" (terjemahan/adaptasi). Bebas dikosongkan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalAuthor?: string;
}
