import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

// Beda dari UpdateLibraryDto/UpdateBookDto (yang sengaja tidak menerima slug
// lewat update) — slug Platform BOLEH diubah lewat admin console (dikonfirmasi
// 11 Sep 2026), karena Owner butuh jalur perbaiki typo/rename subdomain tanpa
// re-create Platform. Konsekuensinya (link/bookmark lama ke subdomain
// sebelumnya berhenti berfungsi) ditampilkan sebagai peringatan di UI, bukan
// dicegah di backend — validasi di sini cuma keunikan, sama seperti create().
export class UpdatePlatformDto {
  @ApiPropertyOptional({ example: 'Teknobuku (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({
    example: 'teknobuku',
    description: 'Slug unik Platform, lowercase-kebab-case. Mengubah ini mengubah subdomain publik {slug}.bookpedia.bagdja.com yang sedang aktif.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "teknobuku")',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/logo-2.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/favicon-2.png' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'JSON color scheme Platform ini' })
  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  lockStudio?: boolean;

  @ApiPropertyOptional({ example: 'reader' })
  @IsOptional()
  @IsString()
  rendererKey?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'teknobuku.com',
    description:
      'Custom domain (opsional) — set dulu di sini SEBELUM memanggil POST /platforms/:id/domain/verify (butuh domain sudah tersimpan, lihat PlatformDomainsService.startVerification()). Ganti/kosongkan domain TIDAK otomatis reset domain_verification_token/domain_verified_at (pakai DELETE .../domain untuk reset penuh).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Jumlah Chapter pertama tiap Book yang bisa dibaca TANPA login. SENTINEL: 0 = SEMUA Chapter di Platform ini gratis (bukan "nol Chapter gratis"). Menaikkan nilai ini otomatis "melonggarkan" Book yang override-nya jadi lebih kecil dari nilai baru (lihat resolveEffectiveMaxFreeChapters), tidak perlu migrasi data Book.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxFreeChapters?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Tampilkan badge status cerita (draft/ongoing/completed) di halaman publik. Tidak mempengaruhi Studio (penulis tetap lihat/ubah status apa pun nilainya).',
  })
  @IsOptional()
  @IsBoolean()
  showBookStatus?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Fase 6 — batas jumlah Tag yang boleh dilekatkan ke satu Book.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxTagsPerBook?: number;
}
