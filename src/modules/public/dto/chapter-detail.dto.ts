import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookSummaryDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Book — dibutuhkan frontend untuk memanggil endpoint reading-progress (bookId)' })
  id: string;

  @ApiProperty({ example: 'Kisah di Ujung Senja' })
  judul: string;

  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover.jpg', nullable: true, description: 'SEO Fase 1 — dipakai og:image halaman Chapter.' })
  coverUrl: string | null;
}

/**
 * Detail 1 Chapter publik (harus `published`, endpoint pemanggil sudah 404
 * kalau draft — lihat PublicService.getChapterByOrderIndex). prev/nextOrderIndex
 * dihitung dari Chapter published TERDEKAT di Book yang sama (melompati
 * Chapter draft di antaranya) — dipakai reader app untuk tombol next/prev
 * tanpa fetch daftar chapter terpisah.
 */
export class ChapterDetailDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Bab 1: Awal Mula' })
  judul: string;

  @ApiProperty({ example: '<p>Isi chapter...</p>' })
  konten: string;

  @ApiProperty({ example: 1, description: 'Urutan tampil Chapter dalam Book (mulai dari 1)' })
  orderIndex: number;

  @ApiPropertyOptional({ nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: BookSummaryDto })
  book: BookSummaryDto;

  @ApiPropertyOptional({
    nullable: true,
    example: null,
    description: 'order_index Chapter published sebelumnya di Book yang sama, null kalau tidak ada',
  })
  prevOrderIndex: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 2,
    description: 'order_index Chapter published berikutnya di Book yang sama, null kalau tidak ada',
  })
  nextOrderIndex: number | null;

  @ApiProperty({
    example: true,
    description:
      'Fase 5 (SEO) — true kalau Chapter ini bisa dibaca TANPA login (di dalam batas "Maximum Free Chapter" efektif Platform/Book). false = reader app wajib redirect ke /auth/login sebelum render konten.',
  })
  isFree: boolean;

  @ApiProperty({
    example: 4.2,
    description: 'Fase 7 — rating Chapter ini (0 kalau belum ada rating). Cuma relevan/ditampilkan reader app kalau platform.ratingMode="chapter".',
  })
  ratingAverage: number;

  @ApiProperty({ example: 3, description: 'Fase 7 — jumlah rating Chapter ini.' })
  ratingCount: number;
}
