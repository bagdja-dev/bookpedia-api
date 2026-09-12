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

import { Platform } from './platform.entity';

/**
 * Kelompok besar di ATAS Genre (11 Sep 2026) — mis. Category "Fiksi" berisi
 * Genre Fantasi/Horor/Misteri/Thriller. Di-scope PER Platform (sama seperti
 * Genre) — taksonomi besar beda-beda antar vertikal novel/buku-teknologi/
 * musik. Relasi ke Genre many-to-many lewat `GenreCategory` (pivot
 * eksplisit, lihat genre-category.entity.ts).
 *
 * TIDAK ada auto-seed default (beda dari 11 Genre default) — Platform baru
 * lahir tanpa Category, Owner buat manual sesuai kebutuhan lewat
 * bookpedia-admin.
 */
@Entity('categories')
@Index(['platform_id', 'slug'], { unique: true })
@Index(['platform_id', 'nama'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform;

  @Column({ type: 'varchar' })
  nama: string;

  @Column({ type: 'varchar' })
  slug: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
