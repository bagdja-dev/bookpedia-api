import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Fiksi (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({ example: 'fiksi', description: 'Mengubah ini mengubah query param filter katalog yang memakai slug Category ini.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "fiksi")',
  })
  slug?: string;
}
