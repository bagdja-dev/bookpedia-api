import { ApiProperty } from '@nestjs/swagger';

/** Shape dipakai POST /chapters/:chapterId/highlights & GET /chapters/:chapterId/highlights. */
export class HighlightResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  chapterId: string;

  @ApiProperty({ example: 120 })
  startOffset: number;

  @ApiProperty({ example: 180 })
  endOffset: number;

  @ApiProperty({ example: 1, description: 'Snapshot content_version Chapter SAAT highlight ini dibuat' })
  contentVersion: number;

  @ApiProperty()
  createdAt: Date;
}
