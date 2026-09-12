import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Platform } from './platform.entity';

/**
 * Port PERSIS `market_staff` dari bagdja-auction-market — keanggotaan BINER
 * (user ini staff Platform ini, titik), TANPA kolom role. Sub-role staff
 * (mis. "Platform Owner" vs "Platform Staff") sengaja ditunda, akan digarap
 * belakangan dan berlaku SEKALIGUS untuk bagdja-auction-market DAN Bookpedia.
 * Invite (§4.1 versi sederhana, 10 Sep 2026): Owner invite langsung insert
 * row aktif di sini, TANPA email/token — staff internal, link accept di-copy
 * manual oleh Owner.
 */
@Entity('platform_staff')
@Unique(['platform_id', 'user_id'])
export class PlatformStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform;

  /**
   * ID user dari bagdja-auth (SSO) — TIDAK ada FK constraint sungguhan
   * (identitas asli dikelola bagdja-auth, lihat schema.dbml Note di root).
   */
  @Column({ type: 'uuid' })
  user_id: string;

  /**
   * Denormalisasi email — tampil di UI staff. Diisi saat invite (versi
   * sederhana §4.1: langsung dari email yang di-invite, bukan hasil accept).
   */
  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
