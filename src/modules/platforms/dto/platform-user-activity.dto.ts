import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformUserActivityItemDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  username: string | null;

  @ApiPropertyOptional({ nullable: true })
  displayName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  readingCount: number;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  highlightCount: number;

  @ApiProperty()
  libraryCount: number;

  @ApiProperty()
  lastActivityAt: Date;
}

export class PlatformUserActivityResponseDto {
  @ApiProperty({ type: PlatformUserActivityItemDto, isArray: true })
  items: PlatformUserActivityItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
