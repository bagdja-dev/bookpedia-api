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

  /** Legacy: referensi secret di env builder. Profil baru memakai password terenkripsi di bawah. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  password_secret_ref: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  key_password_secret_ref: string | null;

  /** AES-256-GCM (KeystoreSecretsService), AAD = `platform:<platform_id>`. */
  @Column({ type: 'text', nullable: true })
  store_password_encrypted: string | null;

  @Column({ type: 'text', nullable: true })
  key_password_encrypted: string | null;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
