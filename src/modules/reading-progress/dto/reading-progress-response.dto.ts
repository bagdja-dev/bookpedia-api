import { ApiProperty } from '@nestjs/swagger';

export class ReadingProgressResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  bookId: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  lastChapterId: string;

  @ApiProperty({ example: 2, description: 'order_index Chapter posisi baca terakhir' })
  lastChapterOrderIndex: number;

  @ApiProperty({ example: 'Bab 2: Pertemuan' })
  lastChapterJudul: string;

  @ApiProperty()
  updatedAt: Date;
}
