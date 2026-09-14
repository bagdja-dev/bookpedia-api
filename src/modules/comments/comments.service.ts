import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Chapter } from '../../entities/chapter.entity';
import { Book } from '../../entities/book.entity';
import { ChatServiceClient, ChatMessageListResponse, ChatMessageResponse } from '../../common/chat-service/chat-service.client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly chatService: ChatServiceClient,
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

  async create(chapterId: string, userId: string, senderDisplayName: string | null, dto: CreateCommentDto): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (chapter.status !== 'published') throw new BadRequestException('Chapter is not published');
    const topicId = await this.getOrCreateTopicForChapter(chapterId, userId);
    return this.chatService.createMessage(topicId, {
      senderUserId: userId,
      senderDisplayName,
      body: dto.body,
      parentMessageId: dto.parentMessageId ?? null,
    });
  }

  async remove(chapterId: string, messageId: string, userId: string): Promise<ChatMessageResponse> {
    const chapter = await this.findPublishedChapter(chapterId);
    if (!chapter.chat_topic_id) throw new NotFoundException('Message not found');
    return this.chatService.deleteMessage(chapter.chat_topic_id, messageId, userId);
  }
}
