import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ReplacePromotionsDto {
  @ApiProperty({
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    description: 'Urutan array = urutan tampil di halaman publik. Maks 10 Book, boleh dari Library manapun (di Platform yang sama), harus sudah published.',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  promotedBookIds: string[];
}
