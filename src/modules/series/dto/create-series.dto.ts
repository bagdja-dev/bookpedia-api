import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nama: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  bookIds?: string[];
}
