import { ApiProperty } from '@nestjs/swagger';

export class HighlightChapterSummaryDto {
  @ApiProperty({ example: 'Bab 2: Pertemuan' })
  judul: string;

  @ApiProperty({ example: 2, description: 'Urutan tampil Chapter dalam Book' })
  orderIndex: number;
}

export class HighlightBookSummaryDto {
  @ApiProperty({ example: 'Kisah di Ujung Senja' })
  judul: string;

  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;
}

/** Shape dipakai GET /highlights — SEMUA highlight user login lintas Book/Chapter, termasuk yang basi. */
export class HighlightListItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  chapterId: string;

  @ApiProperty({ example: 120 })
  startOffset: number;

  @ApiProperty({ example: 180 })
  endOffset: number;

  @ApiProperty({ example: 1, description: 'Snapshot content_version Chapter SAAT highlight ini dibuat' })
  contentVersion: number;

  @ApiProperty({
    example: false,
    description:
      'true kalau content_version snapshot ini beda dari content_version Chapter SAAT INI (Chapter sudah direvisi penulis setelah highlight ini dibuat)',
  })
  isStale: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: HighlightChapterSummaryDto })
  chapter: HighlightChapterSummaryDto;

  @ApiProperty({ type: HighlightBookSummaryDto })
  book: HighlightBookSummaryDto;
}
