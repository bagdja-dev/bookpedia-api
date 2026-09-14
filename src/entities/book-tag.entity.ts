import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';

import { Book } from './book.entity';
import { Tag } from './tag.entity';

/**
 * Pivot many-to-many Book<->Tag (Fase 6, 16 Sep 2026) — satu Book boleh
 * punya banyak Tag. Pivot ENTITY eksplisit, pola sama `GenreCategory`.
 * `ON DELETE CASCADE` di kedua sisi — hapus Book atau Tag cuma
 * membersihkan KAITANNYA, bukan menghapus baris Book/Tag itu sendiri.
 */
@Entity('book_tags')
@Unique(['book_id', 'tag_id'])
export class BookTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  book_id: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book?: Book;

  @Index()
  @Column({ type: 'uuid' })
  tag_id: string;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: Tag;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
