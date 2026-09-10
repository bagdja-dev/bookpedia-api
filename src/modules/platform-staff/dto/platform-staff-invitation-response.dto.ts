import { ApiProperty } from '@nestjs/swagger';

/**
 * Dikembalikan SEKALI ke Owner tepat setelah invite dibuat — SENGAJA
 * menyertakan `token` (beda dari list item). Versi sederhana §4.1 (10 Sep
 * 2026, tanpa MessagingModule/email otomatis): Owner meng-copy `token` ini
 * dan share link accept-nya sendiri secara manual ke calon staff.
 */
export class PlatformStaffInvitationResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  platformId: string;

  @ApiProperty({ example: 'staff@example.com' })
  email: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'Token accept — share manual ke calon staff (mis. lewat chat), BUKAN dikirim email otomatis' })
  token: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}
