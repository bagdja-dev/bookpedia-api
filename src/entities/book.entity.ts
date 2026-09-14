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

import { Genre } from './genre.entity';
import { Category } from './category.entity';
import { Platform } from './platform.entity';

export type BookStatus = 'draft' | 'ongoing' | 'completed';
export type BookType = 'original' | 'translation' | 'adaptation';

/**
 * Satu Book = satu karya (novel/cerita berseri) milik satu Library
 * (`library_id`). Fase 1 — lihat execution-plan.md & plan/bookpedia/schema.dbml.
 * `slug` UNIK GLOBAL lintas platform (bukan per-library) — dipakai di URL
 * publik `/book/{slug}` mulai Fase 2.
 *
 * Fase 4 (§4.1, 10 Sep 2026): `platform_id` DENORMALISASI dari
 * `library.platform_id` (bukan cuma bisa di-derive lewat JOIN) — supaya
 * unique slug per-Platform tidak butuh JOIN, dan query katalog publik
 * cukup `WHERE platform_id = X`. WAJIB diisi sama dengan
 * `libraries.platform_id` milik Book itu, dijaga di service layer
 * (BooksService.create()), TIDAK PERNAH diterima sebagai input client.
 * Nullable SENGAJA di kolom DB (lihat migration 20260910010000) —
 * instance existing di-backfill di §4.4.
 */
@Entity('books')
@Index(['platform_id', 'slug'], { unique: true })
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  library_id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  platform_id: string | null;

  @ManyToOne(() => Platform, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform | null;

  @Column({ type: 'varchar', length: 255 })
  judul: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  sinopsis: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  genre_id: string | null;

  /**
   * Relasi ke lookup table `genres` — nullable, ON DELETE SET NULL (Book
   * tanpa genre tetap valid). Lihat plan/bookpedia/schema.dbml Table genres.
   */
  @ManyToOne(() => Genre, { nullable: true })
  @JoinColumn({ name: 'genre_id' })
  genre?: Genre | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  /**
   * Category yang dipilih terpisah dari Genre (§4.5, 11 Sep 2026) — TIDAK
   * diturunkan otomatis dari pivot `genre_categories`, penulis pilih manual
   * di form Book. Nullable, ON DELETE SET NULL (Book tanpa Category valid).
   */
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_url: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: BookStatus;

  /**
   * original/translation/adaptation — memfasilitasi penulis yang
   * menerjemahkan/mengadaptasi karya orang lain (Library = penerbit/
   * penerjemah, bukan penulis asli). Dipasangkan dengan `original_author`.
   */
  @Column({ type: 'enum', enum: ['original', 'translation', 'adaptation'], enumName: 'book_type', default: 'original' })
  book_type: BookType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  original_author: string | null;

  /**
   * Saklar publikasi level Book — terpisah dari `status` (label progres
   * narasi) dan dari `chapters.status` per-chapter. `null` = belum
   * dipublish. Book tampil di `/public/*` HANYA kalau kolom ini terisi
   * DAN punya >=1 Chapter published (lihat PublicService).
   */
  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null;

  /**
   * Override opsional `platforms.max_free_chapters` (Fase 5, SEO) — `NULL` =
   * ikut kebijakan Platform apa adanya. Kalau diisi: WAJIB `0` (Book ini
   * sepenuhnya gratis) atau lebih besar dari nilai Platform saat ini —
   * divalidasi di `BooksService` lewat `assertValidBookMaxFreeChapters()`,
   * TIDAK di-enforce sebagai DB constraint. Lihat plan/bookpedia/overview.md §11.
   */
  @Column({ type: 'int', nullable: true })
  max_free_chapters: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
