import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ChapterStatus = 'draft' | 'published';

/**
 * Satu Chapter = satu bab milik satu Book (`book_id`). Fase 1 — lihat
 * execution-plan.md & plan/novelo/schema.dbml.
 *
 * `content_version` naik tiap kali `konten` berubah (dibandingkan dengan
 * nilai lama, bukan cuma "field dikirim") — dipakai anti-drift highlight
 * di Fase 3 (`chapter_highlights.content_version`). `published_at` diisi
 * saat status pindah draft->published, di-null-kan lagi saat unpublish.
 * Lihat aturan lengkap di ChaptersService.update().
 *
 * `UNIQUE(book_id, order_index)` dibuat DEFERRABLE INITIALLY DEFERRED di
 * migration SQL supaya endpoint reorder bisa update banyak baris dalam satu
 * transaction tanpa gagal di state antara yang sementara duplikat.
 */
@Entity('chapters')
@Unique(['book_id', 'order_index'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'varchar', length: 255 })
  judul: string;

  @Column({ type: 'text', default: '' })
  konten: string;

  @Column({ type: 'integer' })
  order_index: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: ChapterStatus;

  @Column({ type: 'integer', default: 1 })
  content_version: number;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
