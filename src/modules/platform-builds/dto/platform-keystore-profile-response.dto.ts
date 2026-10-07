import { ApiProperty } from '@nestjs/swagger';

/** Profil keystore tanpa password/lokasi file — password hanya lewat endpoint `/passwords`. */
export class PlatformKeystoreProfileResponseDto {
  @ApiProperty({ example: '7e81cf22-2d9f-4cc2-b0d3-e5af1fe7f670' })
  id: string;

  @ApiProperty({ example: 'd9f8a6e2-1da8-43d7-bd40-1b4d1d3f3b2a', nullable: true })
  platform_id: string | null;

  @ApiProperty({ example: 'Novello Play signing' })
  name: string;

  @ApiProperty({ example: 'novello-release', description: 'Alias key di dalam JKS.' })
  alias: string;

  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  status: 'active' | 'inactive';

  @ApiProperty({ example: true, description: 'true = password tersimpan terenkripsi dan siap dipakai build release.' })
  has_passwords: boolean;

  @ApiProperty({ example: '2026-10-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-10-07T12:00:00.000Z' })
  updated_at: Date;
}
