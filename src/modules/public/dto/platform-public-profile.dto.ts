import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Profil Platform yang aman diekspos publik tanpa auth — pengganti langsung
 * `GET /public/config` lama (Fase 4, §4.1, 10 Sep 2026). SENGAJA tidak
 * menyertakan `id`/`domain`/`domainVerifiedAt`/`isActive`/timestamps (field
 * administratif, cukup lewat `GET /platforms/:id` yang butuh auth).
 */
export class PlatformPublicProfileDto {
  @ApiProperty({ example: 'Teknobuku' })
  nama: string;

  @ApiProperty({ example: 'teknobuku' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconUrl: string | null;

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'reader' })
  rendererKey: string;

  @ApiProperty({
    example: 0,
    description:
      'Fase 5 (SEO) — jumlah Chapter pertama tiap Book yang bisa dibaca tanpa login. 0 = SEMUA Chapter gratis (bukan "nol Chapter gratis"). Dipakai Studio untuk validasi/hint override per-Book.',
  })
  maxFreeChapters: number;

  @ApiProperty({
    example: true,
    description: 'Tampilkan badge status cerita (draft/ongoing/completed) di halaman publik. false = sembunyikan dari katalog/profil Library/detail Book (Studio tidak terpengaruh).',
  })
  showBookStatus: boolean;

  @ApiProperty({ example: 5, description: 'Fase 6 — batas jumlah Tag yang boleh dilekatkan ke satu Book. Dipakai Studio untuk validasi/hint input Tag.' })
  maxTagsPerBook: number;

  @ApiPropertyOptional({
    example: 'google9bbe81680154a078.html',
    nullable: true,
    description: 'Verifikasi Google Search Console (17 Sep 2026) — dipakai middleware bookpedia-app membalas /{filename} apa adanya per-Host yang resolve ke Platform ini.',
  })
  searchConsoleVerificationFilename: string | null;

  @ApiPropertyOptional({ example: 'google-site-verification: google9bbe81680154a078.html', nullable: true })
  searchConsoleVerificationContent: string | null;
}
