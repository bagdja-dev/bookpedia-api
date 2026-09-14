import { ApiProperty } from '@nestjs/swagger';

export class ChapterRatingResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  chapterId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5, description: 'Rating user login untuk Chapter ini' })
  rating: number;

  @ApiProperty()
  updatedAt: Date;
}
