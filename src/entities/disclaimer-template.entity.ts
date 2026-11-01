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
import { Library } from './library.entity';

/**
 * Template disclaimer per-Platform (Admin) atau per-Studio/Library (Owner).
 *  - Platform level: `platform_id` diisi, `library_id` null — tersedia semua
 *    Book di Platform tersebut.
 *  - Studio level: `library_id` diisi, `platform_id` null — hanya Book di
 *    Library/Studio tersebut.
 *
 * Tampil di halaman detail Book (di bawah sinopsis, di atas tombol aksi)
 * sebagai "sesion disclaimer".
 */
@Entity('disclaimer_templates')
@Index(['platform_id'], { unique: false })
@Index(['library_id'], { unique: false })
export class DisclaimerTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  platform_id: string | null;

  @ManyToOne(() => Platform, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  library_id: string | null;

  @ManyToOne(() => Library, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'library_id' })
  library?: Library | null;

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
