import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { PlatformStaffInvitation } from '../../entities/platform-staff-invitation.entity';
import { InvitePlatformStaffDto } from './dto/invite-platform-staff.dto';
import { PlatformStaffResponseDto } from './dto/platform-staff-response.dto';
import { PlatformStaffInvitationResponseDto } from './dto/platform-staff-invitation-response.dto';
import type { PlatformStaffInvitationListItemDto } from './dto/platform-staff-invitation-list-item.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

/**
 * Port dari `MarketStaffService` (bagdja-auction-api) — versi sederhana
 * §4.1 (10 Sep 2026, dikonfirmasi user): TANPA `MessagingService`/email
 * otomatis. Owner invite → dapat `token` di response, share link accept-nya
 * sendiri secara manual. `user_id` di `PlatformStaff` baru terisi saat
 * invitee accept sambil login (JWT mereka sendiri memberi userId) — bukan
 * di-resolve dari email saat invite (bagdja-auth tidak punya endpoint
 * lookup email->user_id yang bisa dipanggil service-to-service, lihat
 * riwayat keputusan Fase 4 §4.1).
 */
@Injectable()
export class PlatformStaffService {
  constructor(
    @InjectRepository(PlatformStaff)
    private readonly staffRepo: Repository<PlatformStaff>,
    @InjectRepository(PlatformStaffInvitation)
    private readonly invitationRepo: Repository<PlatformStaffInvitation>,
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
  ) {}

  // ─── Staff ─────────────────────────────────────────────────────

  async getStaffByPlatform(platformId: string): Promise<PlatformStaff[]> {
    return this.staffRepo.find({
      where: { platform_id: platformId, is_active: true },
      order: { created_at: 'ASC' },
    });
  }

  async removeStaff(platformId: string, staffId: string): Promise<DeletedResponseDto> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId, platform_id: platformId } });
    if (!staff) throw new NotFoundException('Staff not found');

    await this.staffRepo.remove(staff);
    return { deleted: true };
  }

  // ─── Invitations ───────────────────────────────────────────────

  async inviteStaff(
    platformId: string,
    inviterUserId: string,
    dto: InvitePlatformStaffDto,
  ): Promise<PlatformStaffInvitation> {
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform not found');

    const existingStaff = await this.staffRepo.findOne({
      where: { platform_id: platformId, email: dto.email },
    });
    if (existingStaff) {
      throw new ConflictException('User with this email is already a staff member of this platform');
    }

    const pendingInvitation = await this.invitationRepo.findOne({
      where: {
        platform_id: platformId,
        email: dto.email,
        is_accepted: false,
        expires_at: MoreThan(new Date()),
      },
    });
    if (pendingInvitation) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const invitation = this.invitationRepo.create({
      platform_id: platformId,
      email: dto.email,
      invited_by: inviterUserId,
      token: randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return this.invitationRepo.save(invitation);
  }

  /**
   * Undangan yang SUDAH diterima sengaja tidak diikutkan — begitu diterima,
   * orangnya sudah muncul di `getStaffByPlatform()` (Daftar Staff), jadi
   * menampilkannya lagi di sini cuma duplikasi.
   */
  async getInvitationsByPlatform(platformId: string): Promise<PlatformStaffInvitationListItemDto[]> {
    const invitations = await this.invitationRepo.find({
      where: { platform_id: platformId, is_accepted: false },
      order: { created_at: 'DESC' },
    });

    const now = new Date();
    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      status: invitation.expires_at < now ? 'expired' : 'pending',
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
    }));
  }

  async acceptInvitation(token: string, userId: string, userEmail?: string): Promise<PlatformStaff> {
    const invitation = await this.invitationRepo.findOne({
      where: { token, is_accepted: false },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    const existingStaff = await this.staffRepo.findOne({
      where: { platform_id: invitation.platform_id, user_id: userId },
    });
    if (existingStaff) {
      invitation.is_accepted = true;
      invitation.accepted_at = new Date();
      await this.invitationRepo.save(invitation);
      return existingStaff;
    }

    const staff = this.staffRepo.create({
      platform_id: invitation.platform_id,
      user_id: userId,
      email: userEmail ?? invitation.email,
      is_active: true,
    });

    const savedStaff = await this.staffRepo.save(staff);

    invitation.is_accepted = true;
    invitation.accepted_at = new Date();
    await this.invitationRepo.save(invitation);

    return savedStaff;
  }

  // ─── Response mapping ──────────────────────────────────────────

  toResponseDto(staff: PlatformStaff): PlatformStaffResponseDto {
    return {
      id: staff.id,
      platformId: staff.platform_id,
      userId: staff.user_id,
      email: staff.email,
      isActive: staff.is_active,
      createdAt: staff.created_at,
      updatedAt: staff.updated_at,
    };
  }

  toInvitationResponseDto(invitation: PlatformStaffInvitation): PlatformStaffInvitationResponseDto {
    return {
      id: invitation.id,
      platformId: invitation.platform_id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    };
  }
}
