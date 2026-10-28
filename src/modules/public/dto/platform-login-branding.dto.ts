import { ApiProperty } from '@nestjs/swagger';

/**
 * Branding halaman login.bagdja.com untuk satu Platform — kontrak yang
 * diharapkan bagdja-login dari `brandingUrl` client app (lihat
 * core/bagdja-login/src/app/api/branding/route.ts). Field null = bagdja-login
 * memakai default client app/Bagdja.
 */
export class PlatformLoginBrandingDto {
  @ApiProperty({ example: 'Novello', nullable: true, description: 'Nama Platform, tampil di "Untuk melanjutkan ke ..."' })
  name: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/platform/novello/logo.png', nullable: true, description: 'Logo Platform (logo_url).' })
  logoUrl: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/platform/novello/login-bg.jpg', nullable: true, description: 'Background halaman login (login_background_url).' })
  backgroundUrl: string | null;
}
