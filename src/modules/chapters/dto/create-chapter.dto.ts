import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'Bab 1: Awal Mula' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  judul: string;

  @ApiPropertyOptional({
    example: '<p>Isi chapter dari editor Studio...</p>',
    description: 'Konten rich text/HTML. Default string kosong kalau tidak dikirim.',
  })
  @IsOptional()
  @IsString()
  konten?: string;
}
