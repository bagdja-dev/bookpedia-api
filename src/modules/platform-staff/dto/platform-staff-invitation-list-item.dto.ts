import { ApiProperty } from '@nestjs/swagger';

export type PlatformStaffInvitationStatus = 'pending' | 'expired';

/**
 * Item list undangan Staff — SENGAJA tidak menyertakan `token` (beda dengan
 * `PlatformStaffInvitationResponseDto` yang dikembalikan sekali ke inviter
 * tepat setelah invite dibuat). Undangan yang sudah diterima juga TIDAK
 * muncul di sini — begitu diterima, orangnya sudah tercatat di endpoint
 * Daftar Staff.
 */
export class PlatformStaffInvitationListItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'staff@example.com' })
  email: string;

  @ApiProperty({
    enum: ['pending', 'expired'],
    description: '"pending" belum lewat batas waktu, "expired" sudah lewat batas waktu (keduanya belum diterima)',
  })
  status: PlatformStaffInvitationStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;
}
