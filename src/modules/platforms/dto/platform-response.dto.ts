import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Teknobuku' })
  nama: string;

  @ApiProperty({ example: 'teknobuku' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/favicon.png', nullable: true })
  faviconUrl: string | null;

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'reader' })
  rendererKey: string;

  @ApiPropertyOptional({ example: 'teknobuku.com', nullable: true })
  domain: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'NULL = domain custom belum/tidak lolos verifikasi' })
  domainVerifiedAt: Date | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
