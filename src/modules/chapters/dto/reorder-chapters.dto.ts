import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderChapterItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Chapter (harus milik bookId di URL)' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 1, description: 'order_index baru untuk Chapter ini' })
  @IsInt()
  @Min(1)
  orderIndex: number;
}

export class ReorderChaptersDto {
  @ApiProperty({
    type: [ReorderChapterItemDto],
    description: 'Daftar Chapter yang diubah urutannya, diupdate dalam satu DB transaction',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderChapterItemDto)
  items: ReorderChapterItemDto[];
}
