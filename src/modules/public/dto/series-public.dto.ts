import { ApiProperty } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

export class SeriesPublicDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'The Last Journey' })
  nama: string;

  @ApiProperty({ type: BookCatalogDto, isArray: true, description: 'Daftar buku publik yang termasuk dalam series ini.' })
  books: BookCatalogDto[];
}
