import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import type { BookStatus, BookType } from '../../../entities/book.entity';

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

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'ID genre dari GET /public/genres. Kirim null untuk mengosongkan genre Book. 400 kalau tidak match genre manapun.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  genreId?: string | null;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID Category dari GET /public/platforms/{slug}/categories. Kirim null untuk mengosongkan. 400 kalau tidak match Category manapun.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover-2.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'ongoing', 'completed'])
  status?: BookStatus;

  @ApiPropertyOptional({
    example: true,
    description:
      'Saklar publikasi level Book (terpisah dari status draft/ongoing/completed di atas, dan dari status publish per-Chapter). true = publish Book (isi published_at = now()), false = batalkan publish (published_at jadi null). Book baru tampil di /public/* kalau ini true DAN punya >=1 Chapter published.',
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    example: 'translation',
    enum: ['original', 'translation', 'adaptation'],
    description: 'original / translation / adaptation — Book terjemahan/adaptasi karya orang lain.',
  })
  @IsOptional()
  @IsIn(['original', 'translation', 'adaptation'])
  bookType?: BookType;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Nama penulis asli. Kirim string kosong untuk mengosongkan.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalAuthor?: string | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description:
      'Override "Maximum Free Chapter" milik Platform (Fase 5, SEO). Kirim null untuk kembali ikut kebijakan Platform. Kalau diisi: WAJIB 0 (Book ini sepenuhnya gratis) atau lebih besar dari nilai Platform saat ini — 400 kalau melanggar.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxFreeChapters?: number | null;

  @ApiPropertyOptional({
    example: ['petualangan', 'slow-burn'],
    description:
      'Fase 6 — ganti SELURUH Tag Book ini (bukan tambah/hapus sebagian). Kirim [] untuk menghapus semua Tag. Teks apa adanya (BUKAN slug/UUID) — find-or-create per nama. Ditolak 400 kalau jumlahnya melebihi maxTagsPerBook milik Platform.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: '{{title}} — {{platform}}', description: 'Template override title SEO Book.' })
  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}} di {{platform}}.', description: 'Template override description SEO Book.' })
  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @ApiPropertyOptional({ example: '{{title}}', description: 'Template override H1 SEO Book.' })
  @IsOptional()
  @IsString()
  seoH1?: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}}', description: 'Template override og:title SEO Book.' })
  @IsOptional()
  @IsString()
  seoOgTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca cerita lengkap {{title}} di {{platform}}.', description: 'Template override og:description SEO Book.' })
  @IsOptional()
  @IsString()
  seoOgDescription?: string | null;

  @ApiPropertyOptional({ example: 'book', enum: ['website', 'book', 'profile'], nullable: true, description: 'Override og:type SEO Book.' })
  @IsOptional()
  @IsIn(['website', 'book', 'profile'])
  seoOgType?: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Novel', nullable: true, description: 'Prefix SEO Book.' })
  @IsOptional()
  @IsString()
  seoPrefix?: string | null;

  @ApiPropertyOptional({ example: 'Bahasa Indonesia', nullable: true, description: 'Suffix SEO Book.' })
  @IsOptional()
  @IsString()
  seoSuffix?: string | null;
}
