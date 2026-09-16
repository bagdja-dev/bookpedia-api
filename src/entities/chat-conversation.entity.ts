import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ChatConversationContextType = 'peer' | 'library';

/**
 * Mapping LOKAL `topic_id` (bagdja-chat-service) ↔ context Bookpedia — chat-
 * service sendiri domain-agnostic, tidak tahu apa itu Library/user Bookpedia
 * (lihat chat-service/overview.md §4.3.1). Baris ini yang dipakai buat
 * listing "Kotak Masuk" (app) & "Inbox" (Studio), bukan query ke chat-service.
 *
 * `counterpartDisplayName` snapshot BEST-EFFORT dari payload initiator saat
 * `context_type=peer` (bisa kosong) — untuk `context_type=library`, nama/
 * avatar counterpart SELALU di-JOIN fresh ke tabel `libraries` lokal (bukan
 * snapshot, datanya sendiri milik Bookpedia). Lihat bookpedia/execution-plan.md
 * Fase 3.3.
 */
@Entity('chat_conversations')
@Index(['initiatorUserId'])
@Index(['counterpartUserId'])
@Index(['libraryId'])
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'topic_id', unique: true })
  topicId: string;

  @Column({ type: 'varchar', name: 'dm_key', unique: true })
  dmKey: string;

  @Column({ type: 'enum', enum: ['peer', 'library'], enumName: 'chat_conversation_context_type', name: 'context_type' })
  contextType: ChatConversationContextType;

  @Column({ type: 'uuid', name: 'library_id', nullable: true })
  libraryId?: string | null;

  @Column({ type: 'uuid', name: 'initiator_user_id' })
  initiatorUserId: string;

  @Column({ type: 'varchar', name: 'initiator_display_name', nullable: true })
  initiatorDisplayName?: string | null;

  @Column({ type: 'uuid', name: 'counterpart_user_id', nullable: true })
  counterpartUserId?: string | null;

  @Column({ type: 'varchar', name: 'counterpart_display_name', nullable: true })
  counterpartDisplayName?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
