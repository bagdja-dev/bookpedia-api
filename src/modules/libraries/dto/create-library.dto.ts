import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLibraryDto {
  @ApiProperty({
    example: 'novelo',
    description: 'Slug Platform tempat Library ini dibuat (Fase 4, §4.2, koreksi 11 Sep 2026 — sebelumnya platformId/UUID). Slug, BUKAN UUID: endpoint publik sengaja tidak pernah expose Platform id, dan client (browser) belum tentu Owner/Staff platform manapun untuk bisa akses GET /platforms (authenticated) demi dapat UUID-nya. Resolve slug->Platform dilakukan di service layer (PlatformsService.getActivePlatformBySlugOrThrow).',
  })
  @IsString()
  @IsNotEmpty()
  platformSlug: string;

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
