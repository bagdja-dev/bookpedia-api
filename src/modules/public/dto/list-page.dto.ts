import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { BookCatalogDto } from './book-catalog.dto';

/** Query halaman /list/{slug}. */
export class ListPageQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 24, minimum: 4, maximum: 48, default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(48)
  pageSize?: number;
}

/** Section homepage sebagai halaman list publik, termasuk field SEO-nya (template mentah). */
export class ListSectionDto {
  @ApiPropertyOptional({ example: '0b6f3c1e-2a4d-4f5b-9c8d-7e6f5a4b3c2d', nullable: true })
  id: string | null;

  @ApiProperty({ example: 'novel-terjemahan-china', description: 'Slug SEKARANG — bila berbeda dari slug di URL, reader app redirect permanen ke slug ini.' })
  slug: string;

  @ApiProperty({ example: 'China', description: 'Judul yang tampil (homepage & halaman list).' })
  title: string;

  @ApiPropertyOptional({ example: 'Kumpulan novel terjemahan China pilihan redaksi.', nullable: true })
  description: string | null;

  @ApiProperty({ enum: ['grid', 'slider'], example: 'grid' })
  layout: 'grid' | 'slider';

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}}', nullable: true, description: 'Template SEO — token {{title}} {{platform}} {{prefix}} {{suffix}}.' })
  seoH1: string | null;

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}} — {{platform}}', nullable: true })
  seoTitle: string | null;

  @ApiPropertyOptional({ example: 'Baca novel terjemahan {{title}} terbaik di {{platform}}.', nullable: true })
  seoDescription: string | null;

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}}', nullable: true })
  seoOgTitle: string | null;

  @ApiPropertyOptional({ example: 'Kumpulan novel terjemahan {{title}} pilihan.', nullable: true })
  seoOgDescription: string | null;

  @ApiPropertyOptional({ enum: ['website', 'book', 'profile'], nullable: true, example: 'website' })
  seoOgType: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Bagdja', nullable: true })
  seoPrefix: string | null;

  @ApiPropertyOptional({ example: 'Bookpedia', nullable: true })
  seoSuffix: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.bagdja.com/novello/lists/china-og.jpg', nullable: true, description: 'Kosong = pakai cover Book pertama.' })
  seoOgImageUrl: string | null;
}

export class ListPageDto {
  @ApiProperty({ type: ListSectionDto })
  section: ListSectionDto;

  @ApiProperty({ type: BookCatalogDto, isArray: true })
  items: BookCatalogDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 24 })
  pageSize: number;

  @ApiProperty({ example: 58, description: 'Total Book di list (semua halaman).' })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
