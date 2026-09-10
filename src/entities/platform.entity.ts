import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tenant baru di ATAS Library — 1 row = 1 "toko"/target pasar (mis. Platform
 * "novela" utk novel, "teknobuku" utk buku non-fiksi/teknologi). SENGAJA
 * TANPA kolom kepemilikan (owner_user_id/organization_id) — identik `markets`
 * di bagdja-auction-market: satu org tunggal (client_app_id Novelo) otomatis
 * Owner org-wide atas SEMUA row di tabel ini, diverifikasi runtime lewat
 * PlatformAccessGuard (GET /auth/client/{clientAppId}/validate-ownership ke
 * bagdja-auth), BUKAN disimpan sebagai kolom — lihat plan/novelo/overview.md
 * §9.3 untuk alasan lengkap.
 */
@Entity('platforms')
export class Platform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  nama: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar', nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  favicon_url: string | null;

  /**
   * JSON color scheme (bg/surface/foreground/muted/border/terracotta/
   * terracottaForeground/mustard/olive) — gantinya `platform_config.colors`
   * key-value global lama, sekarang per-Platform.
   */
  @Column({ type: 'jsonb' })
  colors: Record<string, string>;

  /**
   * Kalau true, POST /libraries ditutup untuk Platform ini (TANPA
   * allowlist) — gantinya `platform_config.lockStudio` lama.
   */
  @Column({ type: 'boolean', default: false })
  lock_studio: boolean;

  /**
   * Satu Platform = tepat SATU template. Nilai default 'reader' = route
   * group `(reader)/` novelo-app yang sudah ada. Studio (`/dashboard/*`)
   * TIDAK terpengaruh kolom ini sama sekali.
   */
  @Column({ type: 'varchar', default: 'reader' })
  renderer_key: string;

  /**
   * Custom domain opsional milik Platform Owner sendiri — nullable, diisi
   * setelah verifikasi DNS TXT. Kolom domain/token/verified_at persis pola
   * `markets` di bagdja-auction-market.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  domain_verification_token: string | null;

  /**
   * NULL = belum/tidak lolos verifikasi domain. Resolusi domain custom
   * (GET /public/platforms/resolve) mensyaratkan kolom ini terisi DAN
   * is_active=true.
   */
  @Column({ type: 'timestamptz', nullable: true })
  domain_verified_at: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
