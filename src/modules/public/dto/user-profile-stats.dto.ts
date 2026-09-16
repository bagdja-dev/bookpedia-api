import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

/**
 * Statistik publik 1 user — halaman Profile User (bookpedia-app §15.3,
 * susulan 16 Sep 2026). Murni DISPLAY, tidak ada endpoint tulis di scope
 * ini. `bookpedia-api` sengaja tidak punya tabel `users` lokal, jadi nama/
 * avatar user TIDAK ada di sini — dibawa dari konteks klik di frontend.
 * Followers/Following TIDAK ADA sama sekali (bukan ditunda) — Bookpedia
 * tidak punya konsep follow.
 */
export class UserProfileStatsDto {
  @ApiProperty({ example: 12, description: 'Jumlah Book published milik Library yang dimiliki user ini (0 kalau tidak punya Library).' })
  worksCount: number;

  @ApiPropertyOptional({ example: 'kisah-senja', nullable: true, description: 'Slug Library milik user ini, null kalau tidak punya Library.' })
  librarySlug: string | null;

  @ApiProperty({
    type: BookCatalogDto,
    isArray: true,
    description:
      'Daftar Book yang pernah dibuka user ini (dari reading_progress, apa pun statusnya — bukan cuma yang selesai). Catatan sadar: ini riwayat baca privat existing yang SEKARANG JUGA ditampilkan publik, lihat overview.md §15.3.',
  })
  readingList: BookCatalogDto[];
}
