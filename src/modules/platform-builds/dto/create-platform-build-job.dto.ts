import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export const PLATFORM_BUILD_TYPES = ['release', 'debug'] as const;
export const PLATFORM_BUILD_OUTPUT_FORMATS = ['aab', 'apk'] as const;
export type PlatformBuildType = (typeof PLATFORM_BUILD_TYPES)[number];
export type PlatformBuildOutputFormat = (typeof PLATFORM_BUILD_OUTPUT_FORMATS)[number];

export class CreatePlatformBuildJobDto {
  @ApiProperty({ description: 'Platform target build' })
  @IsUUID()
  platformId: string;

  @ApiPropertyOptional({ description: 'Build config ID to use' })
  @IsOptional()
  @IsUUID()
  configId?: string | null;

  @ApiPropertyOptional({
    enum: PLATFORM_BUILD_TYPES,
    description: 'release = ditandatangani keystore profile platform; debug = ditandatangani debug key builder (tanpa keystore). Default: debug untuk environment dev, selain itu release.',
    example: 'release',
  })
  @IsOptional()
  @IsIn(PLATFORM_BUILD_TYPES)
  buildType?: PlatformBuildType;

  @ApiPropertyOptional({
    enum: PLATFORM_BUILD_OUTPUT_FORMATS,
    description: 'aab untuk upload Play Console, apk untuk instal langsung. Default: apk untuk debug, aab untuk release. Debug hanya mendukung apk.',
    example: 'aab',
  })
  @IsOptional()
  @IsIn(PLATFORM_BUILD_OUTPUT_FORMATS)
  outputFormat?: PlatformBuildOutputFormat;

  @ApiPropertyOptional({ description: 'Nama app di launcher Android (terpisah dari nama Platform).', example: 'Novello' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appName?: string;

  @ApiPropertyOptional({ description: 'Bundle ID for Android package name', example: 'com.bagdja.novello' })
  @IsOptional()
  @IsString()
  bundleId?: string;

  @ApiPropertyOptional({ description: 'Target web URL for the TWA app', example: 'https://novello.bagdja.com' })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional({
    description: 'Icon launcher app (upload terpisah dari logo Platform). PNG/JPEG/WebP persegi, disarankan 512x512. Host harus ada di ICON_ALLOWED_HOSTS builder.',
    example: 'https://storage.bagdja.com/bookpedia-assets/platform-builds/icon.png',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'Gambar splash screen saat app dibuka, ditampilkan di tengah di atas splash color. PNG/JPEG/WebP, maks diperkecil ke 1024px. Host harus ada di ICON_ALLOWED_HOSTS builder.',
    example: 'https://storage.bagdja.com/bookpedia-assets/platform-builds/splash.png',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  splashImageUrl?: string;

  @ApiPropertyOptional({ description: 'Theme metadata', type: 'object', default: {} })
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Build metadata', type: 'object', default: {} })
  @IsOptional()
  @IsObject()
  buildConfig?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Signing metadata', type: 'object', default: {} })
  @IsOptional()
  @IsObject()
  signing?: Record<string, unknown>;
}
