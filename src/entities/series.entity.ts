import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BookSeries } from './book-series.entity';

@Entity('series')
export class Series {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  platform_id: string;

  @Column({ type: 'varchar', length: 120 })
  nama: string;

  @OneToMany(() => BookSeries, (bookSeries) => bookSeries.series)
  bookSeries?: BookSeries[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
