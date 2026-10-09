import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import type { CatalogSectionCustomQuery } from '../../../entities/platform.entity';

export class CatalogSectionConfigDto {
  @ApiPropertyOptional({
    example: '0b6f3c1e-2a4d-4f5b-9c8d-7e6f5a4b3c2d',
    description: 'UUID permanen section. Dibuatkan server bila kosong. Mode `manual` mengacu id ini untuk daftar Book-nya.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'top' })
  @IsString()
  key: string;

  /** Legacy field retained for payloads created before queryType was introduced. */
  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  @IsOptional()
  @IsIn(['top', 'new_updated'])
  type?: 'top' | 'new_updated';

  @ApiProperty({
    enum: ['predefined', 'custom', 'manual'],
    default: 'predefined',
    description: 'predefined = Top/Hot atau New Updated; custom = filter genre/category/judul + sort; manual = Book dipilih satu per satu (PUT /platforms/:platformId/homepage-sections/:sectionId/books).',
  })
  @IsOptional()
  @IsIn(['predefined', 'custom', 'manual'])
  queryType?: 'predefined' | 'custom' | 'manual';

  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  @IsIn(['top', 'new_updated'])
  predefinedQuery?: 'top' | 'new_updated';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customQuery?: CatalogSectionCustomQuery;

  @ApiProperty({ example: 'Top / Hot' })
  @IsString()
  title: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: ['grid', 'slider'] })
  @IsIn(['grid', 'slider'])
  layout: 'grid' | 'slider';

  @ApiProperty({ example: 10, minimum: 4, maximum: 24 })
  @IsInt()
  @Min(4)
  @Max(24)
  limit: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  lazyLoad?: boolean;

  @ApiPropertyOptional({ example: 10, minimum: 4, maximum: 50 })
  @IsInt()
  @Min(4)
  @Max(50)
  pageSize?: number;
}