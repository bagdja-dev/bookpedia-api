import { ApiProperty } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

export class OriginalAuthorProfileDto {
  @ApiProperty({ example: 'George Orwell' })
  nama: string;

  @ApiProperty({ type: BookCatalogDto, isArray: true })
  books: BookCatalogDto[];
}
