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
 * Fase 6 (16 Sep 2026) — folksonomi BEBAS, beda dari Genre/Category
 * (taksonomi kurasi, dibuat Owner). Siapa pun penulis (pemilik Library)
 * boleh menciptakan Tag baru begitu saja saat menyimpan Book (find-or-create
 * di `TagsService`, TIDAK ada endpoint CRUD Tag terpisah). Di-scope PER
 * Platform seperti Genre/Category. Lihat plan/bookpedia/overview.md §12.
 */
@Entity('tags')
@Index(['platform_id', 'slug'], { unique: true })
export class Tag {
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
