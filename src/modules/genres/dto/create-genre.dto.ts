import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateGenreDto {
  @ApiProperty({ example: 'Fantasi', description: 'Nama genre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({
    example: 'fantasi',
    description: 'Slug unik genre dalam Platform ini, lowercase-kebab-case',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "fantasi")',
  })
  slug: string;
}
