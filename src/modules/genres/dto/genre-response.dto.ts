import { ApiProperty } from '@nestjs/swagger';

/**
 * Bentuk genre yang diekspos publik — dipakai baik sebagai item daftar
 * `GET /public/genres` maupun sebagai field nested `genre` di response Book
 * (Books module & Public module), supaya konsisten satu shape di semua
 * tempat.
 */
export class GenreResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Fantasi' })
  nama: string;

  @ApiProperty({ example: 'fantasi', description: 'Dipakai sebagai query param filter katalog, mis. ?genre=fantasi' })
  slug: string;
}
