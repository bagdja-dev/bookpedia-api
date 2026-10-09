import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BookSummaryDto } from './chapter-detail.dto';

/**
 * Preview publik 1 Chapter untuk halaman share /book/{slug}/chapter/{n}/preview — hanya
 * potongan paragraf pertama (teks polos), TIDAK PERNAH isi Chapter utuh. Bisa diakses
 * tanpa login (crawler SEO & kartu sosmed).
 */
export class ChapterPreviewDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Bab 1: Awal Mula' })
  judul: string;

  @ApiProperty({ example: 1, description: 'Urutan tampil Chapter dalam Book (mulai dari 1).' })
  orderIndex: number;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01T08:00:00.000Z' })
  publishedAt: Date | null;

  @ApiProperty({ type: BookSummaryDto })
  book: BookSummaryDto;

  @ApiProperty({
    example: 'Hujan turun pelan di atas atap rumah tua itu ketika Laras pertama kali mendengar namanya dipanggil…',
    description: 'Paragraf pertama Chapter sebagai teks polos, maks `chapterPreviewMaxChars` Platform (dipotong di batas kata + "…").',
  })
  excerpt: string;

  @ApiProperty({
    example: false,
    description: 'true = Chapter bisa dibaca tanpa login (tombol "Lanjut membaca"); false = perlu login (tombol "Masuk untuk lanjut membaca").',
  })
  isFree: boolean;
}
