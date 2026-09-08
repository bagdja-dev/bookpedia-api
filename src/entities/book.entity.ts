import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Genre } from './genre.entity';

export type BookStatus = 'draft' | 'ongoing' | 'completed';

/**
 * Satu Book = satu karya (novel/cerita berseri) milik satu Library
 * (`library_id`). Fase 1 — lihat execution-plan.md & plan/novelo/schema.dbml.
 * `slug` UNIK GLOBAL lintas platform (bukan per-library) — dipakai di URL
 * publik `/book/{slug}` mulai Fase 2.
 */
@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  library_id: string;

  @Column({ type: 'varchar', length: 255 })
  judul: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  sinopsis: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  genre_id: string | null;

  /**
   * Relasi ke lookup table `genres` — nullable, ON DELETE SET NULL (Book
   * tanpa genre tetap valid). Lihat plan/novelo/schema.dbml Table genres.
   */
  @ManyToOne(() => Genre, { nullable: true })
  @JoinColumn({ name: 'genre_id' })
  genre?: Genre | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_url: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: BookStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
