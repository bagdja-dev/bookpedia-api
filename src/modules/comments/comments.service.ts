import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Chapter } from '../../entities/chapter.entity';
import { Book } from '../../entities/book.entity';
import { Library } from '../../entities/library.entity';
import { ChatServiceClient, ChatMessageListResponse, ChatMessageResponse } from '../../common/chat-service/chat-service.client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly chatService: ChatServiceClient,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async findPublishedChapter(chapterId: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id: chapterId, status: 'published' } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    return chapter;
  }

  async getOrCreateTopicForChapter(chapterId: string, createdByUserId: string): Promise<string> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (chapter.chat_topic_id) return chapter.chat_topic_id;

    return this.dataSource.transaction(async (manager) => {
      const lockedChapter = await manager.getRepository(Chapter).findOne({
        where: { id: chapter.id, status: 'published' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedChapter) throw new NotFoundException('Chapter not found');
      if (lockedChapter.chat_topic_id) return lockedChapter.chat_topic_id;

      const topic = await this.chatService.createCommentTopic(createdByUserId);
      lockedChapter.chat_topic_id = topic.id;
      await manager.getRepository(Chapter).save(lockedChapter);
      return topic.id;
    });
  }

  async listForChapter(chapterId: string, limit = 20, offset = 0): Promise<ChatMessageListResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (!chapter.chat_topic_id) return { items: [], total: 0 };
    return this.chatService.listMessages(chapter.chat_topic_id, limit, offset);
  }

  async listReplies(chapterId: string, messageId: string): Promise<ChatMessageResponse[]> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (!chapter.chat_topic_id) return [];
    return this.chatService.listReplies(chapter.chat_topic_id, messageId);
  }

  async findPublishedChapterForPlatform(platformId: string, bookSlug: string, orderIndex: number): Promise<Chapter> {
    const book = await this.bookRepo.findOne({ where: { slug: bookSlug, platform_id: platformId } });
    if (!book || !book.published_at) throw new NotFoundException('Chapter not found');

    const chapter = await this.chapterRepo.findOne({
      where: { book_id: book.id, order_index: orderIndex, status: 'published' },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    return chapter;
  }

  async listForPublicChapter(platformId: string, bookSlug: string, orderIndex: number, limit = 20, offset = 0): Promise<ChatMessageListResponse> {
    const chapter = await this.findPublishedChapterForPlatform(platformId, bookSlug, orderIndex);
    return this.listForChapter(chapter.id, limit, offset);
  }

  async listRepliesForPublicChapter(platformId: string, bookSlug: string, orderIndex: number, messageId: string): Promise<ChatMessageResponse[]> {
    const chapter = await this.findPublishedChapterForPlatform(platformId, bookSlug, orderIndex);
    return this.listReplies(chapter.id, messageId);
  }

  /** Ambil satu pesan by id — dipakai reader app untuk append realtime tanpa refetch daftar penuh. */
  async getMessage(chapterId: string, messageId: string): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (!chapter.chat_topic_id) throw new NotFoundException('Message not found');
    return this.chatService.getMessage(chapter.chat_topic_id, messageId);
  }

  async getMessageForPublicChapter(platformId: string, bookSlug: string, orderIndex: number, messageId: string): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapterForPlatform(platformId, bookSlug, orderIndex);
    return this.getMessage(chapter.id, messageId);
  }

  async create(
    chapterId: string,
    userId: string,
    senderDisplayName: string | null,
    senderAvatarUrl: string | null,
    dto: CreateCommentDto,
  ): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (chapter.status !== 'published') throw new BadRequestException('Chapter is not published');
    const topicId = await this.getOrCreateTopicForChapter(chapterId, userId);
    const message = await this.chatService.createMessage(topicId, {
      senderUserId: userId,
      senderDisplayName,
      senderAvatarUrl,
      body: dto.body,
      parentMessageId: dto.parentMessageId ?? null,
    });

    void this.createCommentNotification(chapter, message, userId).catch(() => undefined);
    return message;
  }

  private async createCommentNotification(chapter: Chapter, message: ChatMessageResponse, actorUserId: string): Promise<void> {
    const book = await this.bookRepo.findOne({ where: { id: chapter.book_id } });
    if (!book) return;

    const library = await this.libraryRepo.findOne({ where: { id: book.library_id } });
    if (!library) return;

    let recipientUserId: string | null = null;
    let type: 'comment.created' | 'comment.replied';
    let title: string;
    let messageText: string;
    let entityId = message.id;

    const commentExcerpt = this.excerpt(message.body);

    if (message.parentMessageId) {
      const parent = await this.chatService.getMessage(message.topicId, message.parentMessageId);
      recipientUserId = parent.senderUserId;
      type = 'comment.replied';
      title = 'Ada balasan komentar';
      messageText = `${message.senderDisplayName ?? 'Seseorang'} membalas komentar Anda: "${commentExcerpt}"`;
      entityId = parent.id;
    } else {
      recipientUserId = library.owner_user_id;
      type = 'comment.created';
      title = 'Ada komentar baru';
      messageText = `${message.senderDisplayName ?? 'Seseorang'} mengomentari ${book.judul}: "${commentExcerpt}"`;
    }

    if (!recipientUserId || recipientUserId === actorUserId) return;

    await this.notificationsService.create({
      userId: recipientUserId,
      type,
      title,
      message: messageText.slice(0, 500),
      severity: 'info',
      actionLabel: 'Lihat komentar',
      actionUrl: `/book/${encodeURIComponent(book.slug)}/chapter/${chapter.order_index}#comment-${encodeURIComponent(entityId)}`,
      entityType: 'comment',
      entityId,
    });
  }

  /** Potong isi komentar buat kutipan di notifikasi — sisakan ruang buat prefix nama pengirim dalam limit `message` (500 char). */
  private excerpt(body: string, maxLength = 200): string {
    const trimmed = body.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength).trimEnd()}…`;
  }

  async remove(chapterId: string, messageId: string, userId: string): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (!chapter.chat_topic_id) throw new NotFoundException('Message not found');
    return this.chatService.deleteMessage(chapter.chat_topic_id, messageId, userId);
  }
}
