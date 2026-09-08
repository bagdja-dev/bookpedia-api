import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Lookup table genre — revisi 8 Sep 2026, menggantikan `books.genre` varchar
 * bebas. Sebelumnya ada 2 daftar genre statis hardcoded di frontend (filter
 * katalog vs saran form Book Studio) yang sudah tidak sinkron satu sama lain
 * — disatukan jadi 1 sumber kebenaran di DB. Diseed 11 genre awal saat
 * migration (lihat supabase/migrations/20260908030000_genres.sql), tanpa
 * endpoint create/update/delete di Fase ini (read-only lookup).
 */
@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  nama: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
