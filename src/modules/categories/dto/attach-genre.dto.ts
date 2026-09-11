import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AttachGenreDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID Genre (harus milik Platform yang sama dengan Category ini)' })
  @IsUUID()
  @IsNotEmpty()
  genreId: string;
}
