import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLibraryDto {
  @ApiProperty({ example: 'Kisah Senja', description: 'Nama Library (tampil publik sebagai identitas penulis)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({
    example: 'kisah-senja',
    description: 'Slug unik Library, lowercase-kebab-case (dipakai di URL publik /library/{slug})',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "kisah-senja")',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Kumpulan cerita fiksi kontemporer.' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/library/kisah-senja/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
