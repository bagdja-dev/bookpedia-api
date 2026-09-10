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
 * Satu Library = satu tenant/penulis (MVP: solo, tanpa multi-staff/co-author —
 * lihat overview.md §3 & §4.1). Semua Book/Chapter (Fase 1+) di-scope ke
 * `library_id` milik Library ini.
 */
@Entity('libraries')
@Index(['platform_id', 'slug'], { unique: true })
export class Library {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Ditambahkan Fase 4 (§4.1, 10 Sep 2026) — nullable SENGAJA (lihat
   * migration 20260910010000). Instance existing di-backfill di §4.4;
   * kode aplikasi (LibrariesService.create()) sudah mewajibkan field ini
   * diisi untuk Library BARU sejak §4.1 merge.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  platform_id: string | null;

  @ManyToOne(() => Platform, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform | null;

  /**
   * ID user dari bagdja-auth (SSO) yang memiliki Library ini — TIDAK ada FK
   * constraint sungguhan (identitas asli dikelola bagdja-auth, `users` di
   * sini hanya cache lokal, lihat schema.dbml Note di root).
   */
  @Column({ type: 'uuid' })
  owner_user_id: string;

  @Column({ type: 'varchar', length: 255 })
  nama: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  deskripsi: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
