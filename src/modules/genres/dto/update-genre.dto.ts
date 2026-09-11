import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateGenreDto {
  @ApiPropertyOptional({ example: 'Fantasi (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({ example: 'fantasi', description: 'Mengubah ini mengubah query param filter katalog yang memakai slug genre ini.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "fantasi")',
  })
  slug?: string;
}
