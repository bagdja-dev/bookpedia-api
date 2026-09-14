import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, CreateDateColumn } from 'typeorm';

/**
 * Fase 8 (14 Sep 2026) — Like binary/sekali-tap per Chapter (beda dari
 * `BookRating` yang skala 1-5 dan punya mode Book/Chapter). Satu row = satu
 * user pernah like satu Chapter; unlike = DELETE row-nya (bukan soft-toggle
 * kolom boolean), pola paling sederhana untuk fitur binary tanpa histori.
 *
 * `user_id` TIDAK ada FK constraint sungguhan (identitas asli dikelola
 * bagdja-auth, pola sama seperti `BookRating.user_id`/`ReadingProgress.user_id`).
 */
@Entity('chapter_likes')
@Unique(['user_id', 'chapter_id'])
export class ChapterLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @Index()
  @Column({ type: 'uuid' })
  chapter_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
