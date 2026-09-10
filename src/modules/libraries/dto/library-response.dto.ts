import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LibraryResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Platform pemilik Library ini (Fase 4). Nullable untuk Library lama sebelum backfill §4.4.', nullable: true })
  platformId: string | null;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID user (bagdja-auth) pemilik Library ini' })
  ownerUserId: string;

  @ApiProperty({ example: 'Kisah Senja' })
  nama: string;

  @ApiProperty({ example: 'kisah-senja' })
  slug: string;

  @ApiPropertyOptional({ example: 'Kumpulan cerita fiksi kontemporer.', nullable: true })
  deskripsi: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/library/kisah-senja/cover.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
