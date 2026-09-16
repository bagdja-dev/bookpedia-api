import { ApiProperty } from '@nestjs/swagger';

import type { ChatConversationContextType } from '../../../entities/chat-conversation.entity';

/**
 * Bentuk ringkas 1 percakapan buat daftar "Kotak Masuk" (app)/"Inbox"
 * (Studio) — `contact*` sudah resolved dari sudut pandang user yang minta
 * (bukan initiator/counterpart mentah), lihat `InboxService.toSummary()`.
 */
export class ConversationSummaryDto {
  @ApiProperty({ example: '8d3c8d1e-5ba3-4d99-ac17-2f3d6d7d4e3d', description: 'Topic ID di bagdja-chat-service' })
  topicId: string;

  @ApiProperty({ enum: ['peer', 'library'] })
  contextType: ChatConversationContextType;

  @ApiProperty({ example: '14ff32f5-21d7-4d4a-b0f7-51d4666d4d10', nullable: true, description: 'null kalau contextType=library (lawan bicaranya Library, bukan 1 user)' })
  contactUserId: string | null;

  @ApiProperty({ example: 'N. Prameswari' })
  contactDisplayName: string;

  @ApiProperty({ example: null, nullable: true, description: 'Avatar Library (fresh dari tabel libraries) kalau contextType=library; null buat peer (belum ada sumber avatar user lain).' })
  contactAvatarUrl: string | null;

  @ApiProperty({ example: null, nullable: true, description: 'Slug Library kalau contextType=library, buat link ke /library/{slug}.' })
  librarySlug: string | null;

  @ApiProperty({ example: 3, description: 'Fase 3.5 (Status Baca) — jumlah pesan belum dibaca (bukan milik user login sendiri).' })
  unreadCount: number;

  @ApiProperty()
  createdAt: Date;
}
