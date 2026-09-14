import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'reader' })
  rendererKey: string;

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
