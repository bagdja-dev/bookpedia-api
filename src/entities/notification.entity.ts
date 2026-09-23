import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export type NotificationType =
  | 'comment.created'
  | 'comment.replied'
  | 'comment.liked'
  | 'chapter.published'
  | 'chapter.liked'
  | 'book.published'
  | 'book.approved'
  | 'book.rejected'
  | 'book.rated'
  | 'user.mentioned'
  | 'message.created'
  | 'system';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'readAt'])
@Index(['userId', 'type', 'entityId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  message: string;

  @Column({ type: 'varchar', length: 16 })
  severity: NotificationSeverity;

  @Column({ type: 'varchar', length: 80, name: 'action_label', nullable: true })
  actionLabel: string | null;

  @Column({ type: 'varchar', name: 'action_url' })
  actionUrl: string;

  @Column({ type: 'varchar', length: 80, name: 'entity_type', nullable: true })
  entityType: string | null;

  @Column({ type: 'varchar', length: 160, name: 'entity_id', nullable: true })
  entityId: string | null;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
