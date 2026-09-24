import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { RatingMode, StudioEditMode } from '../../../entities/platform.entity';

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

  @ApiPropertyOptional({ nullable: true, description: 'Suara toast notifikasi in-app; null = pakai default sintesis client-side' })
  notificationSoundUrl: string | null;

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'auto', enum: ['auto', 'manual'], description: 'Mode penyimpanan editor Studio.' })
  studioEditMode: StudioEditMode;

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

  @ApiProperty({ example: true, description: 'Fase 7 — nyala/mati fitur rating Book/Chapter. false = reader app sembunyikan seluruh UI rating.' })
  enableRating: boolean;

  @ApiProperty({
    example: 'book',
    enum: ['book', 'chapter'],
    description: 'Fase 7 — grain rating saat ini: "book" = widget rating di halaman detail Book, "chapter" = widget rating di halaman baca Chapter (agregat Book tetap ditampilkan di detail Book).',
  })
  ratingMode: RatingMode;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Like di ChapterEngagementBar. false = reader app tidak merender tombol Like sama sekali.' })
  enableLike: boolean;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Comment (mock) di ChapterEngagementBar.' })
  enableComment: boolean;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Share di ChapterEngagementBar. Kalau enableLike, enableComment, DAN enableShare ketiganya false, reader app menyembunyikan seluruh bar.' })
  enableShare: boolean;

  @ApiPropertyOptional({ nullable: true })
  seoDefaultH1: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDefaultTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDefaultDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDefaultOgTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDefaultOgDescription: string | null;

  @ApiPropertyOptional({ enum: ['website', 'book', 'profile'], nullable: true })
  seoDefaultOgType: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ nullable: true })
  seoPrefix: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoSuffix: string | null;
}
