import { ApiProperty } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

/**
 * Dua grup slider "Cerita Serupa"/"Cerita Lainnya" — lihat
 * `PublicService.getSimilarBooks()`. `related` dan `others` dijamin TIDAK
 * tumpang tindih (Book yang sama tidak pernah muncul di kedua grup).
 */
export class SimilarBooksResponseDto {
  @ApiProperty({
    type: BookCatalogDto,
    isArray: true,
    description: 'Kurasi manual penulis ("Rekomendasi Penulis", lihat modul Promotions) — urut sesuai posisi yang diatur penulis, bisa kosong.',
  })
  promoted: BookCatalogDto[];

  @ApiProperty({ type: BookCatalogDto, isArray: true, description: 'Genre/category sama atau berbagi minimal 1 Tag — bisa kosong' })
  related: BookCatalogDto[];

  @ApiProperty({ type: BookCatalogDto, isArray: true, description: 'Random murni dari Platform yang sama, exclude Book ini + exclude `related`' })
  others: BookCatalogDto[];
}
