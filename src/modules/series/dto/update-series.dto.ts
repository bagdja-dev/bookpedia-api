import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSeriesDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nama?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  bookIds?: string[];
}
