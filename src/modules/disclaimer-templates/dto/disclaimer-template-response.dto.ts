import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisclaimerTemplateResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Platform pemilik template ini' })
  platformId: string;

  @ApiProperty({ example: 'Disclaimer Cerita Dewasa' })
  nama: string;

  @ApiProperty({ example: 'Cerita ini mengandung tema dewasa yang tidak cocok untuk pembaca di bawah 17 tahun.' })
  content: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DeletedResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}
