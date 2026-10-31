import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDisclaimerTemplateDto {
  @ApiPropertyOptional({ example: 'Disclaimer Cerita Dewasa (Revisi)', description: 'Nama template disclaimer' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({ example: 'Cerita ini mengandung tema dewasa yang tidak cocok untuk pembaca di bawah 17 tahun.', description: 'Konten disclaimer (HTML didukung)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: true, description: 'Template aktif/tidak (tidak aktif = tidak bisa dipilih penulis)' })
  @IsOptional()
  is_active?: boolean;
}
