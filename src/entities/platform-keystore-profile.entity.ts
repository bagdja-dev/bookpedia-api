import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('keystore_profiles')
export class PlatformKeystoreProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  platform_id: string | null;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  alias: string;

  @Column({ type: 'varchar', length: 255 })
  file_ref: string;

  @Column({ type: 'uuid', nullable: true })
  storage_file_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  password_secret_ref: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  key_password_secret_ref: string | null;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
