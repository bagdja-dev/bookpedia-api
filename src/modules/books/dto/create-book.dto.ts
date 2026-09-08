import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: 'Fantasi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
