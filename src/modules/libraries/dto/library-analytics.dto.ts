import { ApiProperty } from '@nestjs/swagger';

export class LibraryAnalyticsBookDto {
  @ApiProperty()
  bookId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  published: boolean;
}

export class LibraryRecentActivityDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  detail: string;

  @ApiProperty()
  activityAt: Date;

  @ApiProperty()
  type: string;
}

export class LibraryAnalyticsDayDto {
  @ApiProperty({ example: '2026-09-23' })
  date: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  readers: number;

  @ApiProperty()
  readingSessions: number;

  @ApiProperty()
  readerGrowth: number;

  @ApiProperty()
  readingGrowth: number;
}

export class LibraryAnalyticsResponseDto {
  @ApiProperty()
  totalBooks: number;

  @ApiProperty()
  publishedBooks: number;

  @ApiProperty()
  totalReaders: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalLikes: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty({ type: LibraryAnalyticsBookDto, isArray: true })
  topBooks: LibraryAnalyticsBookDto[];

  @ApiProperty({ type: LibraryAnalyticsDayDto, isArray: true })
  daily: LibraryAnalyticsDayDto[];

  @ApiProperty({ type: LibraryRecentActivityDto, isArray: true })
  recentActivities: LibraryRecentActivityDto[];
}