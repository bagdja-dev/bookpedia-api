import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Platform } from './platform.entity';

@Entity('platform_build_configs')
export class PlatformBuildConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform: Platform;

  @Column({ type: 'varchar', length: 32 })
  environment: 'dev' | 'staging' | 'prod';

  @Column({ type: 'varchar', length: 64 })
  version_name: string;

  @Column({ type: 'int' })
  version_code: number;

  @Column({ type: 'uuid', nullable: true })
  keystore_profile_id: string | null;

  @Column({ type: 'jsonb', default: {} })
  build_flags: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
