import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformUserReadingItemDto {
  @ApiProperty()
  bookId: string;

  @ApiProperty()
  bookSlug: string;

  @ApiProperty()
  bookTitle: string;

  @ApiPropertyOptional({ nullable: true })
  bookCoverUrl: string | null;

  @ApiProperty()
  lastChapterId: string;

  @ApiProperty()
  lastChapterOrderIndex: number;

  @ApiProperty()
  lastChapterTitle: string;

  @ApiProperty()
  lastReadAt: string;
}

export class PlatformUserReadingResponseDto {
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

  @ApiProperty({ type: PlatformUserReadingItemDto, isArray: true })
  readingList: PlatformUserReadingItemDto[];
}