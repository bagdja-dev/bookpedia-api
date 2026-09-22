import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

import type { CatalogSectionCustomQuery } from '../../../entities/platform.entity';

export class CatalogSectionConfigDto {
  @ApiProperty({ example: 'top' })
  @IsString()
  key: string;

  /** Legacy field retained for payloads created before queryType was introduced. */
  @ApiPropertyOptional({ enum: ['top', 'new_updated'] })
  @IsOptional()
  @IsIn(['top', 'new_updated'])
  type?: 'top' | 'new_updated';

  @ApiProperty({ enum: ['predefined', 'custom'], default: 'predefined' })
  @IsOptional()
  @IsIn(['predefined', 'custom'])
  queryType?: 'predefined' | 'custom';

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