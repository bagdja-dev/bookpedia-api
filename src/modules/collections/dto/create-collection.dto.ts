import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Favorite Romantis' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ example: 'Buku yang pengen aku baca nanti', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
