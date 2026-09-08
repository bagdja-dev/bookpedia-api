import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LibraryResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

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
