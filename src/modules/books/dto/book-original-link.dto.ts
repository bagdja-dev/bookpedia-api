import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class BookOriginalLinkDto {
  @ApiProperty({ example: 'Baca versi asli' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiProperty({ example: 'https://example.com/original-work' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  link: string;
}
