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

  @ApiPropertyOptional({ example: '{{title}} — {{library}}', description: 'Template override title SEO Library.' })
  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca cerita {{title}} di {{platform}}.', description: 'Template override description SEO Library.' })
  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @ApiPropertyOptional({ example: '{{title}}', description: 'Template override H1 SEO Library.' })
  @IsOptional()
  @IsString()
  seoH1?: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}}', description: 'Template override og:title SEO Library.' })
  @IsOptional()
  @IsString()
  seoOgTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca karya {{library}} di {{platform}}.', description: 'Template override og:description SEO Library.' })
  @IsOptional()
  @IsString()
  seoOgDescription?: string | null;

  @ApiPropertyOptional({ example: 'profile', enum: ['website', 'book', 'profile'], nullable: true, description: 'Override og:type SEO Library.' })
  @IsOptional()
  @IsString()
  seoOgType?: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Novel', nullable: true, description: 'Prefix SEO Library.' })
  @IsOptional()
  @IsString()
  seoPrefix?: string | null;

  @ApiPropertyOptional({ example: 'Bahasa Indonesia', nullable: true, description: 'Suffix SEO Library.' })
  @IsOptional()
  @IsString()
  seoSuffix?: string | null;
}
