import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification, type NotificationSeverity, type NotificationType } from '../../entities/notification.entity';
import { NotificationEventBroadcasterService } from './notification-event-broadcaster.service';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  actionLabel?: string | null;
  actionUrl: string;
  entityType?: string | null;
  entityId?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly eventBroadcaster: NotificationEventBroadcasterService,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    if (!input.actionUrl.startsWith('/')) {
      throw new BadRequestException('Notification actionUrl must be a relative path');
    }

    const notification = this.notificationRepo.create({
      ...input,
      severity: input.severity ?? 'info',
      actionLabel: input.actionLabel ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      readAt: null,
    });

    const saved = await this.notificationRepo.save(notification);
    void this.eventBroadcaster.broadcast(saved);
    return saved;
  }

  async listForUser(userId: string, limit: number, offset: number, unread?: boolean) {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (unread === true) query.andWhere('notification.read_at IS NULL');
    if (unread === false) query.andWhere('notification.read_at IS NOT NULL');

    const [items, total] = await query.getManyAndCount();
    return { items, total, limit, offset };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .andWhere('notification.read_at IS NULL')
      .getCount();
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, userId } });
    if (!notification) throw new NotFoundException('Notification not found');

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();

    return { updated: result.affected ?? 0 };
  }

  /**
   * Dipakai saat sumber notifikasi sudah dibaca lewat jalur lain (mis. DM
   * ditandai baca dari Inbox, bukan dari klik toast/Bell) — sinkronkan
   * unread count Bell supaya tidak nyangkut walau user sudah baca isinya.
   */
  async markReadByEntity(userId: string, entityType: string, entityId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId AND entity_type = :entityType AND entity_id = :entityId AND read_at IS NULL', {
        userId,
        entityType,
        entityId,
      })
      .execute();

    return { updated: result.affected ?? 0 };
  }
}
