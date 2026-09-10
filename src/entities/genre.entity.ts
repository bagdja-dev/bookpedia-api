import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Platform } from './platform.entity';

/**
 * Lookup table genre — revisi 8 Sep 2026, menggantikan `books.genre` varchar
 * bebas. Sebelumnya ada 2 daftar genre statis hardcoded di frontend (filter
 * katalog vs saran form Book Studio) yang sudah tidak sinkron satu sama lain
 * — disatukan jadi 1 sumber kebenaran di DB. Diseed 11 genre awal saat
 * migration (lihat supabase/migrations/20260908030000_genres.sql), tanpa
 * endpoint create/update/delete di Fase ini (read-only lookup).
 *
 * Fase 4 (§4.1, 10 Sep 2026): genre di-scope PER Platform — target pasar
 * berbeda (novel vs buku teknologi vs musik) butuh taksonomi genre yang
 * berbeda. `platform_id` nullable SENGAJA (lihat migration
 * 20260910010000) — instance existing di-backfill di §4.4.
 */
@Entity('genres')
@Index(['platform_id', 'slug'], { unique: true })
@Index(['platform_id', 'nama'], { unique: true })
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  platform_id: string | null;

  @ManyToOne(() => Platform, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform | null;

  @Column({ type: 'varchar', unique: true })
  nama: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
