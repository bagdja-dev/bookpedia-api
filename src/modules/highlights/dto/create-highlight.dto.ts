import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateHighlightDto {
  @ApiProperty({ example: 120, description: 'Offset karakter awal highlight dalam konten Chapter' })
  @IsInt()
  @Min(0)
  startOffset: number;

  @ApiProperty({ example: 180, description: 'Offset karakter akhir highlight dalam konten Chapter (harus lebih besar dari startOffset)' })
  @IsInt()
  @Min(0)
  endOffset: number;
}
