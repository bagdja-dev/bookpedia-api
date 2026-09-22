import { ApiProperty } from '@nestjs/swagger';

export class PlatformAnalyticsBookDto {
  @ApiProperty({ example: 'The Early Spring' })
  title: string;

  @ApiProperty({ example: 'Ruang Baca Kita' })
  author: string;

  @ApiProperty({ example: 8420 })
  views: number;

  @ApiProperty({ example: 86, description: 'Views dibandingkan book dengan views tertinggi' })
  progress: number;
}

export class PlatformRecentActivityDto {
  @ApiProperty({ example: 'The Early Spring' })
  title: string;

  @ApiProperty({ example: 'Book dipublish' })
  detail: string;

  @ApiProperty({ example: '2026-09-22T08:45:00.000Z' })
  activityAt: Date;

  @ApiProperty({ example: 'Published' })
  type: string;

  @ApiProperty({ example: 'Nandang Hermawan' })
  userName: string;

  @ApiProperty({ nullable: true, example: 'https://cdn.example.com/avatar.jpg' })
  avatarUrl: string | null;
}

export class PlatformAnalyticsItemDto {
  @ApiProperty({ example: '2026-09-22' })
  date: string;

  @ApiProperty({ example: 6.3, description: 'Pertumbuhan total user aktif kumulatif dibanding hari sebelumnya' })
  userGrowth: number;

  @ApiProperty({ example: 9.2, description: 'Pertumbuhan event membaca dibanding hari sebelumnya' })
  readingGrowth: number;

  @ApiProperty({ example: 3072, description: 'Total user unik yang beraktivitas sampai hari tersebut' })
  totalUsers: number;
}

export class PlatformAnalyticsResponseDto {
  @ApiProperty({ type: PlatformAnalyticsItemDto, isArray: true })
  items: PlatformAnalyticsItemDto[];

  @ApiProperty({ type: PlatformAnalyticsBookDto, isArray: true })
  topBooks: PlatformAnalyticsBookDto[];

  @ApiProperty({ type: PlatformRecentActivityDto, isArray: true })
  recentActivities: PlatformRecentActivityDto[];

  @ApiProperty({ example: 128 })
  totalBooks: number;

  @ApiProperty({ example: 24 })
  totalLibraries: number;

  @ApiProperty({ example: 86 })
  publishedBooks: number;

  @ApiProperty({ example: 2847 })
  totalReaders: number;

  @ApiProperty({ example: 24600 })
  totalViews: number;

  @ApiProperty({ example: 1840 })
  totalComments: number;

  @ApiProperty({ example: 932 })
  totalLikes: number;

  @ApiProperty({ example: 4.6 })
  averageRating: number;
}
