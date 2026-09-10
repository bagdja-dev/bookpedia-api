import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Profil Platform yang aman diekspos publik tanpa auth — pengganti langsung
 * `GET /public/config` lama (Fase 4, §4.1, 10 Sep 2026). SENGAJA tidak
 * menyertakan `id`/`domain`/`domainVerifiedAt`/`isActive`/timestamps (field
 * administratif, cukup lewat `GET /platforms/:id` yang butuh auth).
 */
export class PlatformPublicProfileDto {
  @ApiProperty({ example: 'Teknobuku' })
  nama: string;

  @ApiProperty({ example: 'teknobuku' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconUrl: string | null;

  @ApiProperty({ description: 'JSON color scheme Platform ini' })
  colors: Record<string, string>;

  @ApiProperty({ example: false })
  lockStudio: boolean;

  @ApiProperty({ example: 'reader' })
  rendererKey: string;
}
