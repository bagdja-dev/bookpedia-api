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
 * di bagdja-auction-market: satu org tunggal (client_app_id Bookpedia) otomatis
 * Owner org-wide atas SEMUA row di tabel ini, diverifikasi runtime lewat
 * PlatformAccessGuard (GET /auth/client/{clientAppId}/validate-ownership ke
 * bagdja-auth), BUKAN disimpan sebagai kolom — lihat plan/bookpedia/overview.md
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
   * group `(reader)/` bookpedia-app yang sudah ada. Studio (`/dashboard/*`)
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

  /**
   * Jumlah Chapter pertama (by `order_index`) tiap Book di Platform ini yang
   * bisa dibaca TANPA login — bisa di-override per-Book (lihat
   * `books.max_free_chapters`). SENTINEL: `0` = SEMUA Chapter gratis (BUKAN
   * "nol Chapter gratis"). Lihat plan/bookpedia/overview.md §11 & helper
   * `src/common/utils/free-chapters.util.ts`.
   */
  @Column({ type: 'int', default: 0 })
  max_free_chapters: number;

  /**
   * Kontrol tampil/sembunyi badge status cerita (draft/ongoing/completed) di
   * halaman publik (katalog, profil Library, detail Book) — TIDAK
   * mempengaruhi Studio (penulis tetap lihat & bisa ubah status apa pun
   * nilai kolom ini).
   */
  @Column({ type: 'boolean', default: true })
  show_book_status: boolean;

  /** Fase 6 (16 Sep 2026) — batas jumlah Tag yang boleh dilekatkan ke satu Book, divalidasi di `BooksService`. */
  @Column({ type: 'int', default: 5 })
  max_tags_per_book: number;

  /**
   * Verifikasi Google Search Console per-Platform (17 Sep 2026, SEO susulan)
   * — Owner paste nama file (mis. `google9bbe81680154a078.html`) + isi
   * persis dari Google, dibalas dinamis oleh `middleware.ts` bookpedia-app
   * sesuai Host yang resolve ke Platform ini. NULL = belum diisi.
   */
  @Column({ type: 'varchar', nullable: true })
  search_console_verification_filename: string | null;

  @Column({ type: 'text', nullable: true })
  search_console_verification_content: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
