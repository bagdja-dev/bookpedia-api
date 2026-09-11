import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fiksi', description: 'Nama Category, tampil sebagai kelompok besar di atas Genre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({
    example: 'fiksi',
    description: 'Slug unik Category dalam Platform ini, lowercase-kebab-case',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "fiksi")',
  })
  slug: string;
}
