import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';

import { Genre } from './genre.entity';
import { Category } from './category.entity';

/**
 * Pivot many-to-many Genre<->Category (11 Sep 2026) — pivot ENTITY eksplisit
 * (bukan `@ManyToMany`/`@JoinTable` otomatis TypeORM), konsisten pola
 * `PlatformStaff` (pivot user<->platform) di codebase ini. Satu Genre boleh
 * masuk lebih dari satu Category. `ON DELETE CASCADE` di kedua sisi — hapus
 * Category atau Genre cuma membersihkan KAITANNYA, bukan menghapus baris
 * Genre/Category itu sendiri.
 */
@Entity('genre_categories')
@Unique(['genre_id', 'category_id'])
export class GenreCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  genre_id: string;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre?: Genre;

  @Index()
  @Column({ type: 'uuid' })
  category_id: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
