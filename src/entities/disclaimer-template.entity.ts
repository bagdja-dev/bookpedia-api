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
 * Template disclaimer per-Platform — disusun oleh Owner/Staff di halaman
 * Pengaturan Platform, lalu dipilih penulis saat membuat/mengedit Book.
 * Tampil di halaman detail Book (di bawah sinopsis, di atas tombol aksi)
 * sebagai "sesion disclaimer".
 */
@Entity('disclaimer_templates')
@Index(['platform_id'], { unique: false })
export class DisclaimerTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform: Platform;

  @Column({ type: 'varchar', length: 255 })
  nama: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  /**
   * Template default Platform — ditampilkan di halaman detail Book kalau Book
   * tidak memilih template disclaimer sendiri. Hanya satu per Platform.
   */
  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
