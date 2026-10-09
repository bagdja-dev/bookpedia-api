import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { RatingMode, StudioEditMode } from '../../../entities/platform.entity';
import { CatalogSectionConfigDto } from './catalog-section-config.dto';

export class PlatformResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Teknobuku' })
  nama: string;

  @ApiProperty({ example: 'teknobuku' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/favicon.png', nullable: true })
  faviconUrl: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/notification.mp3', nullable: true })
  notificationSoundUrl: string | null;

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'auto', enum: ['auto', 'manual'] })
  studioEditMode: StudioEditMode;

  @ApiProperty({ example: 'reader' })
  rendererKey: string;

  @ApiProperty({ type: CatalogSectionConfigDto, isArray: true })
  homepageSections: CatalogSectionConfigDto[];

  @ApiPropertyOptional({ example: 'teknobuku.com', nullable: true })
  domain: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'NULL = domain custom belum/tidak lolos verifikasi' })
  domainVerifiedAt: Date | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: 0,
    description: 'Jumlah Chapter pertama tiap Book yang bisa dibaca tanpa login. 0 = SEMUA Chapter gratis (bukan "nol Chapter gratis").',
  })
  maxFreeChapters: number;

  @ApiProperty({ example: true, description: 'Tampilkan badge status cerita di halaman publik. Tidak mempengaruhi Studio.' })
  showBookStatus: boolean;

  @ApiProperty({ example: 5, description: 'Fase 6 — batas jumlah Tag yang boleh dilekatkan ke satu Book.' })
  maxTagsPerBook: number;

  @ApiPropertyOptional({ example: 'google9bbe81680154a078.html', nullable: true, description: 'Verifikasi Google Search Console ("HTML file" method) — nama file persis dari Google.' })
  searchConsoleVerificationFilename: string | null;

  @ApiPropertyOptional({ example: 'google-site-verification: google9bbe81680154a078.html', nullable: true })
  searchConsoleVerificationContent: string | null;

  @ApiPropertyOptional({ example: 'com.bagdja.novello', nullable: true, description: 'TWA Digital Asset Links — package name app Android.' })
  androidPackageName: string | null;

  @ApiProperty({ type: [String], example: ['4A:C0:55:7E:...:CA:3D'], description: 'TWA Digital Asset Links — SHA-256 sertifikat penanda tangan, format AA:BB:...' })
  androidSha256CertFingerprints: string[];

  @ApiProperty({ example: true, description: 'Fase 7 — nyala/mati fitur rating Book/Chapter.' })
  enableRating: boolean;

  @ApiProperty({ example: 'book', enum: ['book', 'chapter'], description: 'Fase 7 — grain rating saat ini.' })
  ratingMode: RatingMode;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Like di ChapterEngagementBar.' })
  enableLike: boolean;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Comment (mock) di ChapterEngagementBar.' })
  enableComment: boolean;

  @ApiProperty({ example: true, description: 'Fase 8 — nyala/mati tombol Share di ChapterEngagementBar.' })
  enableShare: boolean;

  @ApiProperty({ example: false, description: 'Perlindungan konten — blok klik kanan + salin/potong di isi Chapter.' })
  blockContentCopy: boolean;

  @ApiProperty({ example: true, description: 'Perlindungan konten — atribusi (potongan + tautan sumber) saat isi Chapter disalin.' })
  copyAttributionEnabled: boolean;

  @ApiProperty({ example: 200, description: 'Panjang maksimal potongan yang tersalin saat atribusi aktif.' })
  copyAttributionMaxChars: number;

  @ApiPropertyOptional({ example: '{{title}} — {{platform}}', nullable: true, description: 'Template default title SEO Platform.' })
  seoDefaultTitle: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}} di {{platform}}.', nullable: true, description: 'Template default description SEO Platform.' })
  seoDefaultDescription: string | null;

  @ApiPropertyOptional({ example: '{{title}}', nullable: true, description: 'Template default H1 SEO Platform.' })
  seoDefaultH1: string | null;

  @ApiPropertyOptional({ example: 'Baca {{title}}', nullable: true, description: 'Template default og:title SEO Platform.' })
  seoDefaultOgTitle: string | null;

  @ApiPropertyOptional({ example: 'Baca cerita lengkap {{title}} di {{platform}}.', nullable: true, description: 'Template default og:description SEO Platform.' })
  seoDefaultOgDescription: string | null;

  @ApiPropertyOptional({ example: 'website', enum: ['website', 'book', 'profile'], nullable: true, description: 'Default og:type Platform.' })
  seoDefaultOgType: 'website' | 'book' | 'profile' | null;

  @ApiPropertyOptional({ example: 'Novel', nullable: true, description: 'Prefix SEO global Platform.' })
  seoPrefix: string | null;

  @ApiPropertyOptional({ example: 'Bahasa Indonesia', nullable: true, description: 'Suffix SEO global Platform.' })
  seoSuffix: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Konten Terms & Conditions publik Platform ini.' })
  termsAndConditions: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
