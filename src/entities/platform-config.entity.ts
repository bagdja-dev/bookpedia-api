import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Key-value generik untuk pengaturan level platform (bukan per-Library) —
 * lihat plan/novelo/schema.dbml & migration 20260909020000_platform_config.sql
 * untuk konteks lengkap. Diedit langsung di DB untuk sekarang (belum ada
 * novelo-admin).
 */
@Entity('platform_config')
export class PlatformConfig {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
