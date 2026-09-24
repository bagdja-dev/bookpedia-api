import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Kurasi manual penulis — "Book APA yang saya (owner `book_id`) mau
 * tampilkan sebagai rekomendasi di halaman publik Book saya sendiri".
 * `promoted_book_id` BEBAS dari Library manapun di Platform yang sama
 * (bukan cuma milik Library penulis sendiri) — lihat
 * `bookpedia/execution-plan.md` fitur "Rekomendasi Penulis". Penulis hanya
 * bisa mengubah baris dengan `book_id` = Book miliknya sendiri
 * (`PromotionsService.replaceForOwner`, dijaga `BooksService.findOneForOwner`).
 */
@Entity('book_promotions')
@Unique(['book_id', 'promoted_book_id'])
@Index(['book_id', 'position'])
export class BookPromotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Book yang HALAMAN PUBLIKNYA menampilkan rekomendasi ini. */
  @Column({ type: 'uuid' })
  book_id: string;

  /** Book yang direkomendasikan/dipromosikan — bebas dari Library manapun. */
  @Column({ type: 'uuid' })
  promoted_book_id: string;

  /** Urutan tampil (0-based), diatur ulang tiap `replaceForOwner`. */
  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
