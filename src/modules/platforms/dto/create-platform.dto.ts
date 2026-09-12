import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePlatformDto {
  @ApiProperty({ example: 'Teknobuku', description: 'Nama Platform, tampil di header/tab browser/footer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama: string;

  @ApiProperty({
    example: 'teknobuku',
    description: 'Slug unik Platform, lowercase-kebab-case (subdomain default {slug}.bookpedia.bagdja.com)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug harus lowercase-kebab-case (mis. "teknobuku")',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/platform/teknobuku/favicon.png' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiProperty({
    example: {
      bg: '#fbf6ee',
      surface: '#fffdf8',
      foreground: '#2c2114',
      muted: '#7a6c57',
      border: '#e6d9c3',
      terracotta: '#c1502e',
      terracottaForeground: '#fdf8f0',
      mustard: '#d79a2c',
      olive: '#6b7a4c',
    },
    description: 'JSON color scheme Platform ini',
  })
  @IsObject()
  colors: Record<string, string>;

  @ApiPropertyOptional({ example: false, description: 'Kalau true, POST /libraries ditutup untuk Platform ini. Default false.' })
  @IsOptional()
  @IsBoolean()
  lockStudio?: boolean;

  @ApiPropertyOptional({ example: 'reader', description: "Template reader Platform ini. Default 'reader' (route group (reader)/ yang sudah ada)." })
  @IsOptional()
  @IsString()
  rendererKey?: string;
}
