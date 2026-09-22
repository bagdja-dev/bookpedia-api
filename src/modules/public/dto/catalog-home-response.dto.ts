import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BookCatalogDto } from './book-catalog.dto';

export class CatalogHomeSectionDto {
  @ApiProperty()
  key: string;

  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  type?: 'top' | 'new_updated';

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['grid', 'slider'] })
  layout: 'grid' | 'slider';

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiPropertyOptional({ example: true })
  lazyLoad?: boolean;

  @ApiProperty({ type: BookCatalogDto, isArray: true })
  items: BookCatalogDto[];
}

export class CatalogHomeResponseDto {
  @ApiProperty({ type: CatalogHomeSectionDto, isArray: true })
  sections: CatalogHomeSectionDto[];
}