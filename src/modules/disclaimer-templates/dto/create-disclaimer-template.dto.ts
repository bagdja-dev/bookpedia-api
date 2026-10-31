import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDisclaimerTemplateDto {
  @ApiProperty({ example: 'Disclaimer Cerita Dewasa', description: 'Nama template disclaimer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({ example: 'Cerita ini mengandung tema dewasa yang tidak cocok untuk pembaca di bawah 17 tahun.', description: 'Konten disclaimer (HTML didukung)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: true, description: 'Template aktif/tidak (tidak aktif = tidak bisa dipilih penulis)' })
  @IsOptional()
  @IsString()
  is_active?: boolean;
}
