import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RatingMode = 'book' | 'chapter';
export type CatalogSectionType = 'top' | 'new_updated';
export type CatalogSectionQueryType = 'predefined' | 'custom';
export type CatalogSectionLayout = 'grid' | 'slider';
export type CatalogSectionSortField = 'updated' | 'views' | 'title';
export type CatalogSectionSortDirection = 'asc' | 'desc';

export interface CatalogSectionSortRule {
  field: CatalogSectionSortField;
  direction: CatalogSectionSortDirection;
}

export interface CatalogSectionCustomQuery {
  genre?: string | string[];
  category?: string | string[];
  tag?: string;
  library?: string;
  search?: string;
  /** Legacy single sort field. */
  sort?: CatalogSectionSortField;
  sortRules?: CatalogSectionSortRule[];
}

export interface CatalogSectionConfig {
  key: string;
  /** Legacy alias for predefinedQuery; kept for existing stored JSON. */
  type?: CatalogSectionType;
  title: string;
  enabled: boolean;
  queryType?: CatalogSectionQueryType;
  predefinedQuery?: CatalogSectionType;
  customQuery?: CatalogSectionCustomQuery;
  layout: CatalogSectionLayout;
  limit: number;
  lazyLoad?: boolean;
  pageSize?: number;
}

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

  /** Suara toast notifikasi in-app (bell/DM) — null berarti pakai default sintesis client-side. */
  @Column({ type: 'varchar', nullable: true })
  notification_sound_url: string | null;

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

  @Column({ type: 'jsonb', default: () => `'[{"key":"top","type":"top","title":"Top / Hot","enabled":true,"layout":"slider","limit":10},{"key":"new-updated","type":"new_updated","title":"New Updated","enabled":true,"layout":"slider","limit":10}]'` })
  homepage_sections: CatalogSectionConfig[];

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

  /** Fase 7 (18 Sep 2026) — nyala/mati fitur rating Book/Chapter secara keseluruhan di Platform ini. Saat false, seluruh UI rating publik disembunyikan DAN submit baru ditolak backend (defense in depth) — data lama tetap tersimpan. Lihat plan/bookpedia/overview.md §13. */
  @Column({ type: 'boolean', default: true })
  enable_rating: boolean;

  /**
   * Grain rating: 'book' = satu rating untuk keseluruhan Book, 'chapter' =
   * rating terpisah tiap Chapter (diagregasi ke Book saat ditampilkan).
   * Cuma relevan kalau `enable_rating=true`. Ganti mode TIDAK menghapus data
   * mode sebelumnya (tetap tersimpan, berhenti menerima rating baru sampai
   * mode diganti balik) — batasan yang diterima, bukan ditangani migrasi
   * data otomatis.
   */
  @Column({ type: 'varchar', length: 10, default: 'book' })
  rating_mode: RatingMode;

  /**
   * Fase 8 (14 Sep 2026) — nyala/mati tombol Like/Comment/Share di
   * `ChapterEngagementBar` (bottom bar halaman baca Chapter), independen
   * satu sama lain. Kalau ketiganya `false`, reader app menyembunyikan
   * seluruh bar (tidak ada elemen anchor lain yang bisa dipertahankan —
   * beda dari `enable_rating` yang toggle tunggal). Like & Comment
   * ditegakkan juga di backend (defense in depth, pola sama `enable_rating`);
   * Share murni client-side jadi cukup dikontrol di frontend. Lihat
   * plan/bookpedia/overview.md §14.
   */
  @Column({ type: 'boolean', default: true })
  enable_like: boolean;

  @Column({ type: 'boolean', default: true })
  enable_comment: boolean;

  @Column({ type: 'boolean', default: true })
  enable_share: boolean;

  /** SEO template default per Platform — root fallback when Library/Book tidak override. */
  @Column({ type: 'text', nullable: true })
  seo_default_h1: string | null;

  @Column({ type: 'text', nullable: true })
  seo_default_title: string | null;

  @Column({ type: 'text', nullable: true })
  seo_default_description: string | null;

  @Column({ type: 'text', nullable: true })
  seo_default_og_title: string | null;

  @Column({ type: 'text', nullable: true })
  seo_default_og_description: string | null;

  @Column({ type: 'varchar', length: 20, default: 'website' })
  seo_default_og_type: 'website' | 'book' | 'profile';

  @Column({ type: 'text', nullable: true })
  seo_prefix: string | null;

  @Column({ type: 'text', nullable: true })
  seo_suffix: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
