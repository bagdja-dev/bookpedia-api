import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PutReadingProgressDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Book yang sedang dibaca' })
  @IsUUID()
  bookId: string;

  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID Chapter posisi baca terakhir — harus Chapter yang ADA, milik bookId ini, DAN berstatus published',
  })
  @IsUUID()
  chapterId: string;
}
