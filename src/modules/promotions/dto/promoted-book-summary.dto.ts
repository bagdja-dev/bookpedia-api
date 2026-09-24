import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromotedBookSummaryDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Kisah di Ujung Senja' })
  judul: string;

  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'Kisah Senja', description: 'Nama Library pemilik Book ini — bisa Library MANAPUN, bukan cuma milik penulis yang mempromosikan.' })
  libraryNama: string;
}
