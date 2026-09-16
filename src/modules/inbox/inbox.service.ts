import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../../common/auth';
import {
  ChatServiceClient,
  ChatMessageListResponse,
  ChatMessageResponse,
  ChatReadStateItem,
} from '../../common/chat-service/chat-service.client';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { Library } from '../../entities/library.entity';
import { ConversationSummaryDto } from './dto/conversation-summary.dto';
import { LibraryConversationSummaryDto } from './dto/library-conversation-summary.dto';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

/**
 * Integrasi Inbox/Direct Message Bookpedia ke atas `bagdja-chat-service`
 * `type=private, accessMode=direct` (get-or-create by `dmKey`, tanpa
 * invite) — lihat `chat-service/overview.md` §4.3.1 &
 * `bookpedia/execution-plan.md` Fase 3.3. SEMUA logic "kecerdasan" (rumus
 * `dmKey`, resolusi partisipan, mapping topic↔context) ada di sini —
 * chat-service sendiri generic, tidak tahu apa itu Library/user Bookpedia.
 */
@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepo: Repository<ChatConversation>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly chatService: ChatServiceClient,
  ) {}

  private displayNameOf(user: AuthUser): string | null {
    return user.username ?? user.email ?? null;
  }

  /**
   * DM antar dua user (reader↔reader, reader↔penulis) — `dmKey` deterministik
   * dari pasangan `userId` terurut, siapa pun yang mulai duluan selalu
   * menghasilkan key yang sama sehingga balasan dari sisi lain masuk ke
   * thread yang SAMA, bukan bikin thread baru.
   */
  async startPeerConversation(me: AuthUser, targetUserId: string, targetDisplayName: string | null): Promise<ChatConversation> {
    if (targetUserId === me.userId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const dmKey = [me.userId, targetUserId].sort().join(':');

    const existing = await this.conversationRepo.findOne({ where: { dmKey } });
    if (existing) {
      return existing;
    }

    const topic = await this.chatService.createDirectTopic({
      dmKey,
      participantUserIds: [me.userId, targetUserId],
      createdByUserId: me.userId,
    });

    const conversation = this.conversationRepo.create({
      topicId: topic.id,
      dmKey,
      contextType: 'peer',
      libraryId: null,
      initiatorUserId: me.userId,
      initiatorDisplayName: this.displayNameOf(me),
      counterpartUserId: targetUserId,
      counterpartDisplayName: targetDisplayName,
    });

    return this.saveConversationIdempotent(conversation, dmKey);
  }

  /**
   * DM ke Library (Inbox Library) — MVP owner tunggal (lihat
   * `bookpedia/execution-plan.md` Fase 3.3 keputusan poin 2): partisipan
   * cuma `[reader, library.owner_user_id]`, belum sinkron multi-staff
   * karena fitur co-writer sendiri belum ada. `dmKey` dikunci ke
   * `library.id` (stabil), BUKAN daftar staff (yang bisa berubah).
   */
  async startLibraryConversation(me: AuthUser, libraryId: string): Promise<ChatConversation> {
    const library = await this.libraryRepo.findOne({ where: { id: libraryId } });
    if (!library) {
      throw new NotFoundException('Library not found');
    }

    if (library.owner_user_id === me.userId) {
      throw new BadRequestException('Cannot start a conversation with your own Library');
    }

    const dmKey = `library:${library.id}:${me.userId}`;

    const existing = await this.conversationRepo.findOne({ where: { dmKey } });
    if (existing) {
      return existing;
    }

    const topic = await this.chatService.createDirectTopic({
      dmKey,
      participantUserIds: [me.userId, library.owner_user_id],
      createdByUserId: me.userId,
    });

    const conversation = this.conversationRepo.create({
      topicId: topic.id,
      dmKey,
      contextType: 'library',
      libraryId: library.id,
      initiatorUserId: me.userId,
      initiatorDisplayName: this.displayNameOf(me),
      counterpartUserId: null,
      counterpartDisplayName: null,
    });

    return this.saveConversationIdempotent(conversation, dmKey);
  }

  /** Race-safety yang sama seperti `TopicsService.findOrCreateDirect` chat-service — dua sisi trigger create nyaris bersamaan. */
  private async saveConversationIdempotent(conversation: ChatConversation, dmKey: string): Promise<ChatConversation> {
    try {
      return await this.conversationRepo.save(conversation);
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const winner = await this.conversationRepo.findOne({ where: { dmKey } });
      if (!winner) {
        throw err;
      }
      return winner;
    }
  }

  private toSummary(
    conversation: ChatConversation,
    myUserId: string,
    libraryById: Map<string, Library>,
    readStateByTopic: Map<string, ChatReadStateItem>,
  ): ConversationSummaryDto {
    const unreadCount = readStateByTopic.get(conversation.topicId)?.unreadCount ?? 0;

    if (conversation.contextType === 'library') {
      const library = conversation.libraryId ? libraryById.get(conversation.libraryId) : undefined;
      return {
        topicId: conversation.topicId,
        contextType: 'library',
        contactUserId: null,
        contactDisplayName: library?.nama ?? 'Library',
        contactAvatarUrl: library?.cover_url ?? null,
        librarySlug: library?.slug ?? null,
        unreadCount,
        createdAt: conversation.createdAt,
      };
    }

    const iAmInitiator = conversation.initiatorUserId === myUserId;
    return {
      topicId: conversation.topicId,
      contextType: 'peer',
      contactUserId: iAmInitiator ? conversation.counterpartUserId : conversation.initiatorUserId,
      contactDisplayName: (iAmInitiator ? conversation.counterpartDisplayName : conversation.initiatorDisplayName) ?? 'Pengguna',
      contactAvatarUrl: null,
      librarySlug: null,
      unreadCount,
      createdAt: conversation.createdAt,
    };
  }

  async listMyConversations(userId: string): Promise<ConversationSummaryDto[]> {
    const conversations = await this.conversationRepo.find({
      where: [{ initiatorUserId: userId }, { counterpartUserId: userId }],
      order: { createdAt: 'DESC' },
    });

    const libraryIds = [
      ...new Set(conversations.filter((c) => c.contextType === 'library' && c.libraryId).map((c) => c.libraryId as string)),
    ];
    const [libraries, readStates] = await Promise.all([
      libraryIds.length > 0 ? this.libraryRepo.find({ where: { id: In(libraryIds) } }) : Promise.resolve([]),
      this.chatService.getReadState(userId, conversations.map((conversation) => conversation.topicId)),
    ]);
    const libraryById = new Map(libraries.map((library) => [library.id, library]));
    const readStateByTopic = new Map(readStates.map((state) => [state.topicId, state]));

    return conversations.map((conversation) => this.toSummary(conversation, userId, libraryById, readStateByTopic));
  }

  /**
   * Fase 3.5 (Status Baca) — tandai 1 percakapan sudah dibaca `userId`
   * sampai sekarang. Dipakai reader (`POST /inbox/:topicId/read`) DAN
   * Studio (`POST /library/inbox/:topicId/read`, `userId` di situ = owner
   * Library, yang memang partisipan asli di chat-service).
   */
  async markRead(topicId: string, userId: string): Promise<{ topicId: string; lastReadMessageId: string | null }> {
    await this.ensureMyConversation(topicId, userId);
    return this.chatService.markTopicRead(topicId, userId);
  }

  /**
   * "Inbox" Studio — daftar reader yang pernah DM ke Library MILIK USER
   * LOGIN (owner tunggal, MVP §15.4/Fase 3.3 keputusan poin 2). Kembalikan
   * array kosong kalau user belum punya Library sama sekali (bukan error —
   * konsisten pola `GET /libraries/me` yang juga graceful buat belum-onboarding).
   */
  async listLibraryInbox(ownerUserId: string): Promise<LibraryConversationSummaryDto[]> {
    const library = await this.libraryRepo.findOne({ where: { owner_user_id: ownerUserId } });
    if (!library) {
      return [];
    }

    const conversations = await this.conversationRepo.find({
      where: { contextType: 'library', libraryId: library.id },
      order: { createdAt: 'DESC' },
    });

    const readStates = await this.chatService.getReadState(
      ownerUserId,
      conversations.map((conversation) => conversation.topicId),
    );
    const readStateByTopic = new Map(readStates.map((state) => [state.topicId, state]));

    return conversations.map((conversation) => ({
      topicId: conversation.topicId,
      readerUserId: conversation.initiatorUserId,
      readerDisplayName: conversation.initiatorDisplayName ?? 'Pembaca',
      unreadCount: readStateByTopic.get(conversation.topicId)?.unreadCount ?? 0,
      createdAt: conversation.createdAt,
    }));
  }

  /**
   * Defense-in-depth di sisi Bookpedia: verifikasi requester memang bagian
   * dari percakapan ini SEBELUM proxy ke chat-service. chat-service sendiri
   * saat ini BELUM cek partisipan di endpoint baca (celah yang sudah dicatat
   * di `chat-service/plan.md` & `bookpedia/execution-plan.md` Fase 3.3 §
   * Prasyarat — belum ditambal), jadi cek di sini penting, bukan sekadar
   * redundan.
   */
  private async ensureMyConversation(topicId: string, userId: string): Promise<ChatConversation> {
    const conversation = await this.conversationRepo.findOne({ where: { topicId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.initiatorUserId === userId || conversation.counterpartUserId === userId) {
      return conversation;
    }

    if (conversation.contextType === 'library' && conversation.libraryId) {
      const library = await this.libraryRepo.findOne({ where: { id: conversation.libraryId } });
      if (library?.owner_user_id === userId) {
        return conversation;
      }
    }

    throw new ForbiddenException('You are not part of this conversation');
  }

  async listMessages(topicId: string, userId: string, limit = 20, offset = 0): Promise<ChatMessageListResponse> {
    await this.ensureMyConversation(topicId, userId);
    return this.chatService.listMessages(topicId, limit, offset);
  }

  async sendMessage(
    topicId: string,
    user: AuthUser,
    body: string,
    parentMessageId: string | null,
    asLibrary = false,
  ): Promise<ChatMessageResponse> {
    const conversation = await this.ensureMyConversation(topicId, user.userId);

    let senderDisplayName = this.displayNameOf(user);
    let senderAvatarUrl = user.avatar ?? null;

    // Balas "sebagai Library" (Studio Inbox, overview.md §15.2 "satu suara
    // Library") — cuma berlaku kalau requester memang owner Library
    // percakapan ini, diam-diam diabaikan (fallback identitas pribadi)
    // kalau tidak, supaya endpoint ini tetap aman dipanggil apa adanya.
    if (asLibrary && conversation.contextType === 'library' && conversation.libraryId) {
      const library = await this.libraryRepo.findOne({ where: { id: conversation.libraryId } });
      if (library && library.owner_user_id === user.userId) {
        senderDisplayName = library.nama;
        senderAvatarUrl = library.cover_url ?? null;
      }
    }

    return this.chatService.createMessage(topicId, {
      senderUserId: user.userId,
      senderDisplayName,
      senderAvatarUrl,
      body,
      parentMessageId,
    });
  }
}
