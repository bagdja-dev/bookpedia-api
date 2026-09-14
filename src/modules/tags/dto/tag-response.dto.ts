import { ApiProperty } from '@nestjs/swagger';

/** Bentuk Tag yang diekspos publik — dipakai sebagai item daftar/autocomplete DAN sebagai field nested `tags` di response Book. */
export class TagResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  platformId: string;

  @ApiProperty({ example: 'Petualangan Luar Angkasa' })
  nama: string;

  @ApiProperty({ example: 'petualangan-luar-angkasa', description: 'Dipakai sebagai query param filter katalog, mis. ?tag=petualangan-luar-angkasa' })
  slug: string;
}
