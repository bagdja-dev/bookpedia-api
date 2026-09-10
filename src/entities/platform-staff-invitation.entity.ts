import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

import { Platform } from './platform.entity';

/**
 * Port PERSIS `market_staff_invitations` (bagdja-auction-api) MINUS
 * infrastruktur email — koreksi desain §4.1 (10 Sep 2026): `platform_staff.
 * user_id` NOT NULL tapi bagdja-auth tidak punya endpoint lookup
 * email->user_id yang bisa dipanggil service-to-service, jadi `user_id`
 * baru terisi saat invitee klik link accept & login sendiri (JWT mereka
 * memberi userId). Owner invite dapat `token` ini, share link manual
 * (BUKAN email otomatis — versi sederhana, tanpa MessagingModule).
 */
@Entity('platform_staff_invitations')
export class PlatformStaffInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  platform_id: string;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform?: Platform;

  @Column({ type: 'varchar' })
  email: string;

  /** ID user (bagdja-auth) yang mengundang — TIDAK ada FK constraint sungguhan. */
  @Column({ type: 'uuid', nullable: true })
  invited_by: string | null;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_accepted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
