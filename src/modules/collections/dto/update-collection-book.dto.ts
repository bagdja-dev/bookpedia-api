import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export type CollectionBookStatusUpdateDto = 'saved' | 'want_to_read' | 'reading' | 'finished';

export class UpdateCollectionBookDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  notifyOnAuthorUpdate?: boolean;

  @ApiPropertyOptional({ example: 'Buku ini favorite saya', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @ApiPropertyOptional({ example: 'reading', enum: ['saved', 'want_to_read', 'reading', 'finished'] })
  @IsOptional()
  @IsEnum(['saved', 'want_to_read', 'reading', 'finished'])
  status?: CollectionBookStatusUpdateDto;
}
