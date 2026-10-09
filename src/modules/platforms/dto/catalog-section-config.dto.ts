import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUrl, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

import { SECTION_SLUG_PATTERN } from '../../../common/utils/homepage-sections.util';

import type { CatalogSectionCustomQuery } from '../../../entities/platform.entity';

export class CatalogSectionConfigDto {
  @ApiPropertyOptional({
    example: '0b6f3c1e-2a4d-4f5b-9c8d-7e6f5a4b3c2d',
    description: 'UUID permanen section. Dibuatkan server bila kosong. Mode `manual` mengacu id ini untuk daftar Book-nya.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'top' })
  @IsString()
  key: string;

  /** Legacy field retained for payloads created before queryType was introduced. */
  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  @IsOptional()
  @IsIn(['top', 'new_updated'])
  type?: 'top' | 'new_updated';

  @ApiProperty({
    enum: ['predefined', 'custom', 'manual'],
    default: 'predefined',
    description: 'predefined = Top/Hot atau New Updated; custom = filter genre/category/judul + sort; manual = Book dipilih satu per satu (PUT /platforms/:platformId/homepage-sections/:sectionId/books).',
  })
  @IsOptional()
  @IsIn(['predefined', 'custom', 'manual'])
  queryType?: 'predefined' | 'custom' | 'manual';

  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  @IsIn(['top', 'new_updated'])
  predefinedQuery?: 'top' | 'new_updated';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customQuery?: CatalogSectionCustomQuery;

  @ApiProperty({ example: 'Top / Hot' })
  @IsString()
  title: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: ['grid', 'slider'] })
  @IsIn(['grid', 'slider'])
  layout: 'grid' | 'slider';

  @ApiProperty({ example: 10, minimum: 4, maximum: 24 })
  @IsInt()
  @Min(4)
  @Max(24)
  limit: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  lazyLoad?: boolean;

  @ApiPropertyOptional({ example: 10, minimum: 4, maximum: 50 })
  @IsInt()
  @Min(4)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({
    example: 'novel-terjemahan-china',
    description: 'Slug halaman /list/{slug}. Huruf kecil, angka, tanda hubung. Kosong = dibuat dari judul. Harus unik per Platform (bentrok diberi akhiran -2, -3, …). Slug lama otomatis diarahkan ke slug baru.',
  })
  @IsOptional()
  @MaxLength(80)
  @Matches(SECTION_SLUG_PATTERN, { message: 'slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. novel-terjemahan-china)' })
  slug?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['china'],
    description: 'Slug lama untuk redirect — DIKELOLA SERVER. Boleh ikut terkirim (dari respons sebelumnya) tapi nilainya diabaikan.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousSlugs?: string[];

  @ApiPropertyOptional({ example: 'Kumpulan novel terjemahan China pilihan redaksi.', description: 'Deskripsi singkat yang tampil di atas daftar pada halaman list.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}}', description: 'SEO — H1 halaman list. Token: {{title}} {{platform}} {{prefix}} {{suffix}}.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoH1?: string;

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}} — {{platform}}', description: 'SEO — <title> halaman list.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Baca novel terjemahan {{title}} terbaik di {{platform}}.', description: 'SEO — meta description halaman list.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional({ example: 'Novel Terjemahan {{title}}', description: 'og:title kartu sosmed. Kosong = mengikuti SEO title.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoOgTitle?: string;

  @ApiPropertyOptional({ example: 'Kumpulan novel terjemahan {{title}} pilihan.', description: 'og:description. Kosong = mengikuti SEO description.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoOgDescription?: string;

  @ApiPropertyOptional({ enum: ['website', 'book', 'profile'], example: 'website' })
  @IsOptional()
  @IsIn(['website', 'book', 'profile'])
  seoOgType?: 'website' | 'book' | 'profile';

  @ApiPropertyOptional({ example: 'Bagdja', description: 'Nilai token {{prefix}}.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoPrefix?: string;

  @ApiPropertyOptional({ example: 'Bookpedia', description: 'Nilai token {{suffix}}.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoSuffix?: string;

  @ApiPropertyOptional({ example: 'https://cdn.bagdja.com/novello/lists/china-og.jpg', description: 'og:image kartu sosmed (disarankan 1200x630). Kosong = cover Book pertama di list.' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  seoOgImageUrl?: string;
}
