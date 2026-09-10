import { ApiProperty } from '@nestjs/swagger';

import { PlatformResponseDto } from './platform-response.dto';

export class PlatformListResponseDto {
  @ApiProperty({ description: 'true kalau user login adalah Owner (lihat semua Platform, org-wide)' })
  isOwner: boolean;

  @ApiProperty({ type: PlatformResponseDto, isArray: true })
  platforms: PlatformResponseDto[];
}
