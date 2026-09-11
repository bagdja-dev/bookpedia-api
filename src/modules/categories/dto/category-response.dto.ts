import { ApiProperty } from '@nestjs/swagger';

import { GenreResponseDto } from '../../genres/dto/genre-response.dto';

export class CategoryResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  platformId: string;

  @ApiProperty({ example: 'Fiksi' })
  nama: string;

  @ApiProperty({ example: 'fiksi' })
  slug: string;

  @ApiProperty({ type: GenreResponseDto, isArray: true, description: 'Genre yang terkait Category ini' })
  genres: GenreResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
