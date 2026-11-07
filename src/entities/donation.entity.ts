import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_donations')
@Index(['platform_id', 'created_at'])
@Index(['payment_request_id'], { unique: true })
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  platform_id: string;

  @Column({ type: 'uuid', nullable: true })
  payment_request_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'INITIALIZING' })
  status: string;

  @Column({
    type: 'numeric',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'IDR' })
  currency: string;

  @Column({ type: 'varchar', length: 255 })
  option_title: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  status_token_hash: string;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
