import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * `@Query('limit', new ParseIntPipe({ optional: true }))` per-parameter
 * BENTROK dengan global `ValidationPipe({transform:true})` di main.ts —
 * begitu query param kosong, pipeline global ikut memproses dan merusak
 * nilai `undefined` sebelum sampai ke ParseIntPipe, jadi validasi selalu
 * gagal ("numeric string is expected") walau param memang sengaja tidak
 * dikirim. Pola DTO + class-validator/class-transformer ini PERSIS
 * `CatalogQueryDto` (public.controller.ts) yang sudah terbukti jalan
 * berdampingan dengan global ValidationPipe yang sama.
 */
export class ListCommentsQueryDto {
  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
