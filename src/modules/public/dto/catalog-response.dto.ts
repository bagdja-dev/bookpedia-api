import { ApiProperty } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

export class CatalogResponseDto {
  @ApiProperty({ type: BookCatalogDto, isArray: true })
  items: BookCatalogDto[];

  @ApiProperty({ example: 42, description: 'Total Book yang cocok filter (sebelum pagination)' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
