import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

/**
 * Satu row = satu highlight/stabilo teks yang dibuat pembaca di 1 Chapter
 * ("member marker" — Fase 3). `content_version` adalah SNAPSHOT
 * `chapters.content_version` SAAT highlight ini dibuat — dibandingkan dengan
 * content_version Chapter saat ini untuk soft-hide anti-drift (highlight
 * TIDAK dihapus otomatis kalau Chapter direvisi penulis, cuma disembunyikan
 * saat render — lihat HighlightsService).
 *
 * `user_id` TIDAK ada FK constraint sungguhan (pola sama seperti
 * `ReadingProgress.user_id` / `Library.owner_user_id`). `chapter_id` FK
 * ON DELETE CASCADE — hapus Chapter otomatis membersihkan highlight-nya.
 */
@Entity('chapter_highlights')
@Index(['user_id', 'chapter_id'])
export class ChapterHighlight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  chapter_id: string;

  @Column({ type: 'integer' })
  start_offset: number;

  @Column({ type: 'integer' })
  end_offset: number;

  @Column({ type: 'integer' })
  content_version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
