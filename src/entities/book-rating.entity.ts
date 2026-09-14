import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Satu row = rating 1-5 bintang dari 1 user (Fase 7, 18 Sep 2026). SATU
 * tabel dipakai untuk KEDUA mode rating (`platforms.rating_mode`), dibedakan
 * lewat `chapter_id`:
 *  - mode 'book'    -> `chapter_id = NULL`, `book_id` = Book yang dirating.
 *  - mode 'chapter' -> `chapter_id` terisi, `book_id` didenormalisasi dari
 *    Chapter itu (supaya agregat per-Book tidak butuh JOIN ke chapters).
 *
 * Keunikan dijaga migration SQL lewat DUA partial unique index (BUKAN satu
 * `UNIQUE(user_id, book_id, chapter_id)` biasa — Postgres menganggap tiap
 * NULL berbeda, jadi duplikat `chapter_id NULL` tidak akan tertolak):
 * `UNIQUE(user_id, book_id) WHERE chapter_id IS NULL` dan
 * `UNIQUE(user_id, chapter_id) WHERE chapter_id IS NOT NULL`.
 *
 * `user_id` TIDAK ada FK constraint sungguhan (identitas asli dikelola
 * bagdja-auth, pola sama seperti `ReadingProgress.user_id`).
 */
@Entity('book_ratings')
export class BookRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @Index()
  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'uuid', nullable: true })
  chapter_id: string | null;

  @Column({ type: 'int' })
  rating: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
