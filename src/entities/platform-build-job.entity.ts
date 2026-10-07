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
import { PlatformBuildConfig } from './platform-build-config.entity';

export type PlatformBuildJobStatus = 'queued' | 'validating' | 'building' | 'signing' | 'uploading' | 'success' | 'failed' | 'cancelled';

@Entity('platform_build_jobs')
export class PlatformBuildJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform: Platform;

  @Column({ type: 'uuid', nullable: true })
  config_id: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  external_job_id: string | null;

  @ManyToOne(() => PlatformBuildConfig, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'config_id' })
  config: PlatformBuildConfig | null;

  @Column({ type: 'varchar', length: 32, default: 'queued' })
  status: PlatformBuildJobStatus;

  @Column({ type: 'integer', default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  stage: string | null;

  @Column({ type: 'varchar', nullable: true })
  log_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  artifact_url: string | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finished_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
