import { ApiProperty } from '@nestjs/swagger';

/** Bentuk ringkas Category untuk di-embed di response lain (mis. Book) — tanpa nested `genres`. */
export class CategorySummaryDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  platformId: string;

  @ApiProperty({ example: 'Fiksi' })
  nama: string;

  @ApiProperty({ example: 'fiksi' })
  slug: string;
}
