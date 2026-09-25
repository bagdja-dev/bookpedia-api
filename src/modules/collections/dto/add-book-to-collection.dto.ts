import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export type CollectionBookStatusDto = 'saved' | 'want_to_read' | 'reading' | 'finished';

export class AddBookToCollectionDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  bookId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnAuthorUpdate?: boolean;

  @ApiPropertyOptional({ example: 'Buku ini sangat bagus untuk dibaca ulang', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @ApiPropertyOptional({ example: 'saved', enum: ['saved', 'want_to_read', 'reading', 'finished'] })
  @IsOptional()
  @IsEnum(['saved', 'want_to_read', 'reading', 'finished'])
  status?: CollectionBookStatusDto;
}
