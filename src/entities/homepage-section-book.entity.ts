import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Isi section homepage mode "manual" — Book yang dipilih satu per satu oleh Owner/Staff
 * Platform (bukan hasil query). `section_id` = `id` permanen section di
 * `platforms.homepage_sections`. Book yang dihapus ikut terhapus dari list (FK cascade);
 * Book yang di-unpublish tetap tersimpan tapi dilewati saat render homepage.
 * Pola sama `BookPromotion` ("Rekomendasi Penulis").
 */
@Entity('homepage_section_books')
@Unique(['section_id', 'book_id'])
@Index(['platform_id', 'section_id', 'position'])
export class HomepageSectionBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  platform_id: string;

  /** `id` section di `platforms.homepage_sections`. */
  @Column({ type: 'uuid' })
  section_id: string;

  @Column({ type: 'uuid' })
  book_id: string;

  /** Urutan tampil (0-based), diatur ulang tiap replace. */
  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
