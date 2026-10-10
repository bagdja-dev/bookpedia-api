import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { RatingMode, StudioEditMode } from '../../../entities/platform.entity';
import { ReadingTypographyDto } from '../../platforms/dto/reading-typography.dto';

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

  @ApiPropertyOptional({
    example: 'com.bagdja.novello',
    nullable: true,
    description: 'TWA Digital Asset Links (7 Okt 2026) — dipakai middleware bookpedia-app membalas /.well-known/assetlinks.json per-Host.',
  })
  androidPackageName: string | null;

  @ApiProperty({ type: [String], example: ['4A:C0:55:7E:...:CA:3D'], description: 'SHA-256 sertifikat penanda tangan app TWA, format AA:BB:... Kosong = assetlinks tidak disajikan.' })
  androidSha256CertFingerprints: string[];

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

  @ApiProperty({ example: false, description: 'Perlindungan konten — blok klik kanan + salin/potong di isi Chapter.' })
  blockContentCopy: boolean;

  @ApiProperty({ example: true, description: 'Perlindungan konten — atribusi (potongan + tautan sumber) saat isi Chapter disalin.' })
  copyAttributionEnabled: boolean;

  @ApiProperty({ example: 200, description: 'Panjang maksimal potongan yang tersalin saat atribusi aktif.' })
  copyAttributionMaxChars: number;

  @ApiProperty({ example: 400, description: 'Share Chapter — panjang maksimal potongan paragraf di halaman preview.' })
  chapterPreviewMaxChars: number;

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

  @ApiPropertyOptional({ nullable: true, description: 'Konten Terms & Conditions publik Platform ini.' })
  termsAndConditions: string | null;

  @ApiPropertyOptional({ example: '+62 21 555 0123', nullable: true, description: 'Halaman Kontak — nomor telepon.' })
  contactPhone: string | null;

  @ApiPropertyOptional({ example: '0812 3456 7890', nullable: true, description: 'Halaman Kontak — nomor WhatsApp.' })
  contactWhatsapp: string | null;

  @ApiPropertyOptional({ example: 'halo@novello.id', nullable: true, description: 'Halaman Kontak — alamat email.' })
  contactEmail: string | null;

  @ApiProperty({ type: ReadingTypographyDto, description: 'Tipografi teks bacaan, selalu lengkap (default bila belum diatur).' })
  readingTypography: ReadingTypographyDto;
}
