import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export type CollectionBookStatus = 'saved' | 'want_to_read' | 'reading' | 'finished';

@Entity('collection_books')
@Unique(['collection_id', 'book_id'])
export class CollectionBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  collection_id: string;

  @Index()
  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  added_at: Date;

  @Column({ type: 'boolean', default: true })
  notify_on_author_update: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 32, default: 'saved' })
  status: CollectionBookStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
