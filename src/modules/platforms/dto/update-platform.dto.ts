import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import type { RatingMode, StudioEditMode } from '../../../entities/platform.entity';
import { CatalogSectionConfigDto } from './catalog-section-config.dto';

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

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/notification.mp3' })
  @IsOptional()
  @IsString()
  notificationSoundUrl?: string;

  @ApiPropertyOptional({ description: 'JSON color scheme Platform ini' })
  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  lockStudio?: boolean;

  @ApiPropertyOptional({ example: 'auto', enum: ['auto', 'manual'], description: 'Mode penyimpanan editor Studio.' })
  @IsOptional()
  @IsIn(['auto', 'manual'])
  studioEditMode?: StudioEditMode;

  @ApiPropertyOptional({ example: 'reader' })
  @IsOptional()
  @IsString()
  rendererKey?: string;

  @ApiPropertyOptional({ type: CatalogSectionConfigDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogSectionConfigDto)
  homepageSections?: CatalogSectionConfigDto[];

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

  @ApiPropertyOptional({
    example: 'google9bbe81680154a078.html',
    nullable: true,
    description:
      'Verifikasi Google Search Console (17 Sep 2026, "HTML file" method) — nama file persis dari Google. Dibalas dinamis oleh middleware bookpedia-app sesuai Host. Kirim null untuk mengosongkan.',
  })
  @IsOptional()
  @Matches(/^google[a-zA-Z0-9_-]+\.html$/, {
    message: 'searchConsoleVerificationFilename harus format "google<hash>.html" persis dari Google',
  })
  searchConsoleVerificationFilename?: string | null;

  @ApiPropertyOptional({
    example: 'google-site-verification: google9bbe81680154a078.html',
    nullable: true,
    description: 'Isi file verifikasi persis dari Google (biasanya satu baris "google-site-verification: <nama file>"). Kirim null untuk mengosongkan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  searchConsoleVerificationContent?: string | null;

  @ApiPropertyOptional({
    example: 'com.bagdja.novello',
    nullable: true,
    description: 'TWA Digital Asset Links — package name (applicationId) app Android Platform ini. Dipakai middleware bookpedia-app membalas /.well-known/assetlinks.json. Kirim null untuk mengosongkan.',
  })
  @IsOptional()
  @MaxLength(255)
  @Matches(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, {
    message: 'androidPackageName harus berformat package Android, mis. com.bagdja.novello',
  })
  androidPackageName?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['4A:C0:55:7E:8C:7B:9E:BF:EE:37:30:5C:4D:3C:4E:AC:59:E6:19:D7:F2:EC:DA:E0:FC:51:01:F7:69:9F:CA:3D'],
    description: 'TWA Digital Asset Links — SHA-256 sertifikat penanda tangan (release/upload key, Play App Signing, debug key). Boleh dengan atau tanpa titik dua; disimpan uppercase format AA:BB:... Maks 10.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  androidSha256CertFingerprints?: string[];

  @ApiPropertyOptional({ example: true, description: 'Fase 7 — nyala/mati fitur rating Book/Chapter. Saat false, seluruh UI rating publik disembunyikan dan submit baru ditolak backend.' })
  @IsOptional()
  @IsBoolean()
  enableRating?: boolean;

  @ApiPropertyOptional({
    example: 'book',
    enum: ['book', 'chapter'],
    description: 'Fase 7 — grain rating: "book" (satu rating per Book) atau "chapter" (rating terpisah tiap Chapter, diagregasi ke Book saat ditampilkan). Ganti mode tidak menghapus data mode sebelumnya.',
  })
  @IsOptional()
  @IsIn(['book', 'chapter'])
  ratingMode?: RatingMode;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Like di ChapterEngagementBar.' })
  @IsOptional()
  @IsBoolean()
  enableLike?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Comment (mock) di ChapterEngagementBar.' })
  @IsOptional()
  @IsBoolean()
  enableComment?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Fase 8 — nyala/mati tombol Share di ChapterEngagementBar. Kalau enableLike, enableComment, DAN enableShare ketiganya false, reader app menyembunyikan seluruh bar.' })
  @IsOptional()
  @IsBoolean()
  enableShare?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Perlindungan konten — blok klik kanan serta aksi salin/potong di isi Chapter. Seleksi teks tetap aktif (fitur highlight). Bila aktif, mengalahkan atribusi.' })
  @IsOptional()
  @IsBoolean()
  blockContentCopy?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Perlindungan konten — saat isi Chapter disalin, clipboard hanya berisi potongan teks + tautan sumber.' })
  @IsOptional()
  @IsBoolean()
  copyAttributionEnabled?: boolean;

  @ApiPropertyOptional({ example: 200, minimum: 20, maximum: 2000, description: 'Panjang maksimal potongan yang ikut tersalin saat atribusi aktif.' })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(2000)
  copyAttributionMaxChars?: number;

  @ApiPropertyOptional({ example: 400, minimum: 100, maximum: 2000, description: 'Share Chapter — panjang maksimal potongan paragraf pertama di halaman preview /book/{slug}/chapter/{n}/preview (juga meta description & kartu sosmed).' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  chapterPreviewMaxChars?: number;

  @ApiPropertyOptional({ example: '{{title}} — {{platform}}', description: 'Template default title SEO Platform.' })
  @IsOptional()
  @IsString()
  seoDefaultTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}} di {{platform}}.', description: 'Template default description SEO Platform.' })
  @IsOptional()
  @IsString()
  seoDefaultDescription?: string | null;

  @ApiPropertyOptional({ example: '{{title}}', description: 'Template default H1 SEO Platform.' })
  @IsOptional()
  @IsString()
  seoDefaultH1?: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}}', description: 'Template default og:title SEO Platform.' })
  @IsOptional()
  @IsString()
  seoDefaultOgTitle?: string | null;

  @ApiPropertyOptional({ example: 'Baca cerita lengkap {{title}} di {{platform}}.', description: 'Template default og:description SEO Platform.' })
  @IsOptional()
  @IsString()
  seoDefaultOgDescription?: string | null;

  @ApiPropertyOptional({ example: 'website', enum: ['website', 'book', 'profile'], nullable: true, description: 'Default og:type Platform. Kirim null untuk reset.' })
  @IsOptional()
  @IsIn(['website', 'book', 'profile'])
  seoDefaultOgType?: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Novel', nullable: true, description: 'Prefix SEO global Platform.' })
  @IsOptional()
  @IsString()
  seoPrefix?: string | null;

  @ApiPropertyOptional({ example: 'Bahasa Indonesia', nullable: true, description: 'Suffix SEO global Platform.' })
  @IsOptional()
  @IsString()
  seoSuffix?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Konten Terms & Conditions publik. Kirim null untuk mengosongkan.' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string | null;

  @ApiPropertyOptional({ example: '+62 21 555 0123', nullable: true, description: 'Halaman Kontak — nomor telepon. Angka, spasi, tanda kurung, titik, tanda hubung, boleh diawali +. Kirim null untuk mengosongkan.' })
  @IsOptional()
  @Matches(/^\+?[0-9(][0-9\s().-]{5,28}$/, { message: 'contactPhone harus berupa nomor telepon (mis. +62 21 555 0123)' })
  contactPhone?: string | null;

  @ApiPropertyOptional({ example: '0812 3456 7890', nullable: true, description: 'Halaman Kontak — nomor WhatsApp (awalan 0 diubah ke 62 untuk tautan wa.me). Kirim null untuk mengosongkan.' })
  @IsOptional()
  @Matches(/^\+?[0-9(][0-9\s().-]{5,28}$/, { message: 'contactWhatsapp harus berupa nomor WhatsApp (mis. 0812 3456 7890)' })
  contactWhatsapp?: string | null;

  @ApiPropertyOptional({ example: 'halo@novello.id', nullable: true, description: 'Halaman Kontak — alamat email. Kirim null untuk mengosongkan.' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string | null;
}
