import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type AuthUser } from '../../common/auth';
import { ConversationSummaryDto } from './dto/conversation-summary.dto';
import { LibraryConversationSummaryDto } from './dto/library-conversation-summary.dto';
import { ListInboxMessagesQueryDto } from './dto/list-inbox-messages-query.dto';
import { SendInboxMessageDto } from './dto/send-inbox-message.dto';
import { StartPeerConversationDto } from './dto/start-peer-conversation.dto';
import { InboxService } from './inbox.service';

/**
 * Inbox/Direct Message reader-side — semua endpoint wajib login (DM cuma
 * antar user yang sudah punya akun, TIDAK ada onboarding di jalur ini, beda
 * dari co-writer invite Fase 3.2 chat-service). Lihat
 * `bookpedia/execution-plan.md` Fase 3.3.
 */
@ApiTags('Inbox')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Post('messages/direct/users/:targetUserId')
  @ApiOperation({ summary: 'Mulai (atau lanjutkan) DM ke user lain — idempoten, aman dipanggil berkali-kali' })
  @ApiOkResponse({ description: 'topicId percakapan — sudah ada sebelumnya atau baru dibuat' })
  async startPeer(
    @CurrentUser() user: AuthUser,
    @Param('targetUserId', new ParseUUIDPipe()) targetUserId: string,
    @Body() dto: StartPeerConversationDto,
  ): Promise<{ topicId: string }> {
    const conversation = await this.inboxService.startPeerConversation(user, targetUserId, dto.targetDisplayName ?? null);
    return { topicId: conversation.topicId };
  }

  @Post('messages/direct/libraries/:libraryId')
  @ApiOperation({ summary: 'Mulai (atau lanjutkan) DM ke Library (Inbox Library) — idempoten, MVP owner tunggal' })
  @ApiOkResponse({ description: 'topicId percakapan — sudah ada sebelumnya atau baru dibuat' })
  async startLibrary(
    @CurrentUser() user: AuthUser,
    @Param('libraryId', new ParseUUIDPipe()) libraryId: string,
  ): Promise<{ topicId: string }> {
    const conversation = await this.inboxService.startLibraryConversation(user, libraryId);
    return { topicId: conversation.topicId };
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Kotak Masuk — semua percakapan milik user login, terbaru dulu' })
  @ApiOkResponse({ type: ConversationSummaryDto, isArray: true })
  async listInbox(@CurrentUser() user: AuthUser): Promise<ConversationSummaryDto[]> {
    return this.inboxService.listMyConversations(user.userId);
  }

  @Get('inbox/:topicId/messages')
  @ApiOperation({ summary: 'Daftar pesan top-level 1 percakapan (403 kalau bukan partisipan)' })
  async listMessages(
    @CurrentUser() user: AuthUser,
    @Param('topicId') topicId: string,
    @Query() query: ListInboxMessagesQueryDto,
  ) {
    return this.inboxService.listMessages(topicId, user.userId, query.limit ?? 20, query.offset ?? 0);
  }

  @Post('inbox/:topicId/messages')
  @ApiOperation({ summary: 'Kirim pesan ke 1 percakapan (403 kalau bukan partisipan)' })
  async sendMessage(@CurrentUser() user: AuthUser, @Param('topicId') topicId: string, @Body() dto: SendInboxMessageDto) {
    return this.inboxService.sendMessage(topicId, user, dto.body, dto.parentMessageId ?? null, dto.asLibrary ?? false);
  }

  @Post('inbox/:topicId/read')
  @ApiOperation({ summary: 'Tandai 1 percakapan sudah dibaca sampai sekarang (403 kalau bukan partisipan)' })
  async markRead(@CurrentUser() user: AuthUser, @Param('topicId') topicId: string) {
    return this.inboxService.markRead(topicId, user.userId);
  }

  @Get('library/inbox')
  @ApiOperation({
    summary: 'Inbox Studio — reader yang pernah DM ke Library milik user login',
    description: 'Array kosong (BUKAN 404) kalau user belum punya Library. MVP owner tunggal — belum ada sinkronisasi multi-staff/co-writer.',
  })
  @ApiOkResponse({ type: LibraryConversationSummaryDto, isArray: true })
  async listLibraryInbox(@CurrentUser() user: AuthUser): Promise<LibraryConversationSummaryDto[]> {
    return this.inboxService.listLibraryInbox(user.userId);
  }

  @Post('library/inbox/:topicId/read')
  @ApiOperation({ summary: 'Studio: tandai 1 percakapan (dari sudut pandang Library) sudah dibaca sampai sekarang' })
  async markLibraryRead(@CurrentUser() user: AuthUser, @Param('topicId') topicId: string) {
    return this.inboxService.markRead(topicId, user.userId);
  }
}
