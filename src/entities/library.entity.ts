import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Satu Library = satu tenant/penulis (MVP: solo, tanpa multi-staff/co-author —
 * lihat overview.md §3 & §4.1). Semua Book/Chapter (Fase 1+) di-scope ke
 * `library_id` milik Library ini.
 */
@Entity('libraries')
export class Library {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
