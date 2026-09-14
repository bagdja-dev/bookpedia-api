import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Isi komentar', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;

  @ApiPropertyOptional({ description: 'ID komentar yang dibalas', nullable: true })
  @IsOptional()
  @IsUUID()
  parentMessageId?: string | null;
}
