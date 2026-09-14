import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class PutBookRatingDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Book yang dirating — hanya valid kalau Platform pemiliknya sedang ratingMode="book"' })
  @IsUUID()
  bookId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5, description: 'Rating 1-5 bintang' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
