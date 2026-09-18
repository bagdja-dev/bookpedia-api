import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

/**
 * Profil publik Library — `books` HANYA berisi Book dengan minimal 1
 * Chapter `published` (aturan sama seperti /public/catalog).
 */
export class LibraryProfileDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Kisah Senja' })
  nama: string;

  @ApiProperty({ example: 'kisah-senja' })
  slug: string;

  @ApiPropertyOptional({ example: 'Kumpulan cerita fiksi kontemporer.', nullable: true })
  deskripsi: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/library/kisah-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoH1: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoOgTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoOgDescription: string | null;

  @ApiPropertyOptional({ enum: ['website', 'book', 'profile'], nullable: true })
  seoOgType: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ nullable: true })
  seoPrefix: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoSuffix: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: BookCatalogDto, isArray: true })
  books: BookCatalogDto[];
}
