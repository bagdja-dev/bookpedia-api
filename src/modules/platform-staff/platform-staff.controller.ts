import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly, CurrentUser, type AuthUser } from '../../common/auth';
import { PlatformStaffService } from './platform-staff.service';
import { InvitePlatformStaffDto } from './dto/invite-platform-staff.dto';
import { PlatformStaffResponseDto } from './dto/platform-staff-response.dto';
import { PlatformStaffInvitationResponseDto } from './dto/platform-staff-invitation-response.dto';
import { PlatformStaffInvitationListItemDto } from './dto/platform-staff-invitation-list-item.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

@ApiTags('Platform Staff')
@Controller('platforms/:platformId/staff')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformStaffController {
  constructor(private readonly platformStaffService: PlatformStaffService) {}

  @Get()
  @ApiOperation({ summary: 'List staff aktif untuk satu Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: [PlatformStaffResponseDto] })
  async list(@Param('platformId') platformId: string): Promise<PlatformStaffResponseDto[]> {
    const staff = await this.platformStaffService.getStaffByPlatform(platformId);
    return staff.map((s) => this.platformStaffService.toResponseDto(s));
  }

  @Get('invitations')
  @OwnerOnly()
  @ApiOperation({ summary: 'List undangan Staff (pending/expired) untuk satu Platform (Owner only)' })
  @ApiOkResponse({ type: [PlatformStaffInvitationListItemDto] })
  async listInvitations(@Param('platformId') platformId: string): Promise<PlatformStaffInvitationListItemDto[]> {
    return this.platformStaffService.getInvitationsByPlatform(platformId);
  }

  @Post()
  @OwnerOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Undang Staff baru ke Platform (Owner only — Staff tidak boleh menambah Staff lain)',
    description: 'Versi sederhana (§4.1, 10 Sep 2026): TANPA email otomatis. Response berisi token — share link accept-nya sendiri secara manual ke calon staff.',
  })
  @ApiOkResponse({ type: PlatformStaffInvitationResponseDto })
  async invite(
    @Param('platformId') platformId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: InvitePlatformStaffDto,
  ): Promise<PlatformStaffInvitationResponseDto> {
    const invitation = await this.platformStaffService.inviteStaff(platformId, user.userId, dto);
    return this.platformStaffService.toInvitationResponseDto(invitation);
  }

  @Delete(':staffId')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus Staff dari Platform (Owner only)' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async remove(
    @Param('platformId') platformId: string,
    @Param('staffId') staffId: string,
  ): Promise<DeletedResponseDto> {
    return this.platformStaffService.removeStaff(platformId, staffId);
  }
}

@ApiTags('Platform Invitation Accept')
@Controller('platform-invitations')
export class PlatformInvitationAcceptController {
  constructor(private readonly platformStaffService: PlatformStaffService) {}

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terima undangan Staff Platform menggunakan token (user harus login — JWT sendiri memberi userId)' })
  @ApiOkResponse({ type: PlatformStaffResponseDto })
  async accept(
    @Param('token') token: string,
    @CurrentUser() user: AuthUser,
  ): Promise<PlatformStaffResponseDto> {
    const staff = await this.platformStaffService.acceptInvitation(token, user.userId, user.email);
    return this.platformStaffService.toResponseDto(staff);
  }
}
