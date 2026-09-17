import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, UpdateDateColumn } from 'typeorm';

/**
 * Satu row = posisi baca terakhir 1 user untuk 1 Book (Fase 3 — resume baca
 * otomatis / tombol "Lanjutkan Baca"). Di-upsert saat pembaca pindah/scroll
 * chapter — lihat plan/bookpedia/schema.dbml & execution-plan.md Fase 3.
 *
 * `user_id` TIDAK ada FK constraint sungguhan (identitas asli dikelola
 * bagdja-auth, pola sama seperti `Library.owner_user_id`). `book_id` &
 * `last_chapter_id` FK ON DELETE CASCADE ke books/chapters — hapus Book atau
 * Chapter otomatis membersihkan progress terkait.
 */
@Entity('reading_progress')
@Unique(['user_id', 'book_id'])
export class ReadingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'uuid' })
  last_chapter_id: string;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
