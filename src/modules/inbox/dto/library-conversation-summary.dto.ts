import { ApiProperty } from '@nestjs/swagger';

/** Bentuk ringkas 1 percakapan buat "Inbox" Studio — kontaknya SELALU reader (initiator), Library tidak pernah initiator di MVP ini. */
export class LibraryConversationSummaryDto {
  @ApiProperty({ example: '8d3c8d1e-5ba3-4d99-ac17-2f3d6d7d4e3d', description: 'Topic ID di bagdja-chat-service' })
  topicId: string;

  @ApiProperty({ example: '14ff32f5-21d7-4d4a-b0f7-51d4666d4d10', description: 'User ID reader yang mengirim DM ini' })
  readerUserId: string;

  @ApiProperty({ example: 'Pembaca Setia', description: 'Snapshot nama reader SAAT DM dimulai (bisa berbeda dari nama terkini)' })
  readerDisplayName: string;

  @ApiProperty()
  createdAt: Date;
}
