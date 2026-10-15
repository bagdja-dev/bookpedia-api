import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PlatformAdSlotDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: '', maxLength: 50000, description: 'HTML atau snippet script iklan tepercaya.' })
  @IsString()
  @MaxLength(50000)
  script: string;
}

export class PlatformAdSlotsDto {
  @ApiProperty({ example: '#f97316', description: 'Warna border bersama untuk semua slot iklan.' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  borderColor: string;

  @ApiProperty({ type: PlatformAdSlotDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => PlatformAdSlotDto)
  homepage: PlatformAdSlotDto;

  @ApiProperty({ type: PlatformAdSlotDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => PlatformAdSlotDto)
  bookDetail: PlatformAdSlotDto;

  @ApiProperty({ type: PlatformAdSlotDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => PlatformAdSlotDto)
  chapterReader: PlatformAdSlotDto;
}