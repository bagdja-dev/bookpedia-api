import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Book } from './book.entity';
import { Series } from './series.entity';

@Entity('book_series')
@Index(['series_id', 'book_id'], { unique: true })
export class BookSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  series_id: string;

  @ManyToOne(() => Series, (series) => series.bookSeries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series?: Series;

  @Index()
  @Column({ type: 'uuid' })
  book_id: string;

  @ManyToOne(() => Book, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id' })
  book?: Book;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
