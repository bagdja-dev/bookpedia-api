import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly, CurrentUser, type AuthUser } from '../../common/auth';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { PlatformListResponseDto } from './dto/platform-list-response.dto';
import { PlatformUserActivityResponseDto } from './dto/platform-user-activity.dto';
import { PlatformUserReadingResponseDto } from './dto/platform-user-reading.dto';
import { PlatformAnalyticsResponseDto } from './dto/platform-analytics.dto';
import {
  PlatformOwnerWalletService,
  type InitializedOrganizationWallet,
  type PlatformOwnerWalletSettings,
} from './platform-owner-wallet.service';
import { AssignPlatformOwnerWalletDto } from './dto/assign-platform-owner-wallet.dto';
import { CreatePlatformOwnerOrganizationDto } from './dto/create-platform-owner-organization.dto';

interface RequestWithPlatformAccess extends Request {
  platformAccess?: {
    isOwner: boolean;
    ownedOrganizations: Array<{ id: string; name: string; orgId: string }>;
    organizations: Array<{ id: string; name: string; orgId: string }>;
  };
}

@ApiTags('Platforms')
@Controller('platforms')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformsController {
  constructor(
    private readonly platformsService: PlatformsService,
    private readonly platformOwnerWalletService: PlatformOwnerWalletService,
    private readonly platformAccessGuard: PlatformAccessGuard,
  ) {}

  @Get('owner-organizations')
  @ApiOperation({ summary: 'List organizations where the current user is an Owner' })
  async listOwnerOrganizations(@Req() req: Request): Promise<Array<{ id: string; name: string; orgId: string }>> {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('User authorization is required');
    return this.platformOwnerWalletService.listOwnerOrganizations(authorization);
  }

  @Post('owner-organizations')
  @ApiOperation({ summary: 'Create an organization for the current authenticated user' })
  async createOwnerOrganization(@Body() dto: CreatePlatformOwnerOrganizationDto, @Req() req: Request) {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('User authorization is required');
    const organization = await this.platformOwnerWalletService.createOrganization(authorization, dto);
    this.platformAccessGuard.invalidateMembershipCache(authorization);
    return organization;
  }

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Create a Platform in an organization owned by the current user' })
  @ApiOkResponse({ type: PlatformResponseDto, description: 'Platform berhasil dibuat' })
  async create(@Body() dto: CreatePlatformDto): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.create(dto);
    return this.platformsService.toResponseDto(platform);
  }

  @Get()
  @ApiOperation({
    summary: 'Platform switcher — list Platform untuk user login',
    description: 'Owner melihat Platform milik organisasi yang ia miliki; staff melihat Platform yang memiliki row aktif untuk user di platform_staff.',
  })
  @ApiOkResponse({ type: PlatformListResponseDto })
  async findMine(@CurrentUser() user: AuthUser, @Req() req: RequestWithPlatformAccess): Promise<PlatformListResponseDto> {
    const isOwner = req.platformAccess?.isOwner ?? false;
    const ownedOrganizations = req.platformAccess?.ownedOrganizations ?? [];
    const platforms = await this.platformsService.findMine(
      user.userId,
      ownedOrganizations.map((organization) => organization.id),
    );
    const organizationsById = new Map(
      (req.platformAccess?.organizations ?? []).map((organization) => [organization.id, organization]),
    );
    return {
      isOwner,
      ownedOrganizations,
      platforms: platforms.map((platform) =>
        this.platformsService.toResponseDto(
          platform,
          organizationsById.get(platform.owner_org_id ?? '')?.name ?? null,
        ),
      ),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: PlatformResponseDto })
  async findOne(@Param('id') id: string): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.findById(id);
    if (!platform) throw new NotFoundException('Platform not found');
    return this.platformsService.toResponseDto(platform);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Daftar user yang berinteraksi dengan Platform' })
  @ApiOkResponse({ type: PlatformUserActivityResponseDto })
  async listUsers(@Param('id') id: string, @Query('page') pageParam?: string, @Query('limit') limitParam?: string, @Query('search') search?: string): Promise<PlatformUserActivityResponseDto> {
    const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? '25', 10) || 25));
    return this.platformsService.listUserActivity(id, page, limit, search?.trim() ?? '');
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Analytics pertumbuhan user dan aktivitas membaca harian' })
  @ApiOkResponse({ type: PlatformAnalyticsResponseDto })
  async getAnalytics(@Param('id') id: string, @Query('days') daysParam?: string): Promise<PlatformAnalyticsResponseDto> {
    const days = Math.min(31, Math.max(1, Number.parseInt(daysParam ?? '7', 10) || 7));
    return this.platformsService.getAnalytics(id, days);
  }

  @Get(':id/users/:userId/reading')
  @ApiOperation({ summary: 'Detail reading list user pada Platform' })
  @ApiOkResponse({ type: PlatformUserReadingResponseDto })
  async getUserReading(@Param('id') id: string, @Param('userId') userId: string): Promise<PlatformUserReadingResponseDto> {
    return this.platformsService.getUserReading(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branding/pengaturan Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: PlatformResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformDto): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.update(id, dto);
    return this.platformsService.toResponseDto(platform);
  }

  @Get(':id/owner-wallet')
  @OwnerOnly()
  @ApiOperation({ summary: 'Get owner organizations and the Platform recipient wallet' })
  async getOwnerWallet(@Param('id') id: string, @Req() req: Request): Promise<PlatformOwnerWalletSettings> {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('User authorization is required');
    return this.platformOwnerWalletService.getSettings(id, authorization);
  }

  @Post(':id/owner-wallet/initialize')
  @OwnerOnly()
  @ApiOperation({
    summary: 'Initialize the tenant organization IDR wallet without linking it to donations',
  })
  async initializeOwnerWallet(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<InitializedOrganizationWallet> {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('User authorization is required');
    return this.platformOwnerWalletService.initializeOwnerOrganizationWallet(
      id,
      authorization,
    );
  }

  @Put(':id/owner-wallet')
  @OwnerOnly()
  @ApiOperation({ summary: 'Assign an owned organization wallet as the Platform recipient' })
  async assignOwnerWallet(
    @Param('id') id: string,
    @Body() dto: AssignPlatformOwnerWalletDto,
    @Req() req: Request,
  ): Promise<PlatformOwnerWalletSettings> {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('User authorization is required');
    return this.platformOwnerWalletService.assignExistingOrganization(id, authorization, dto);
  }

  @Delete(':id/owner-wallet')
  @OwnerOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the Platform recipient wallet' })
  async clearOwnerWallet(@Param('id') id: string): Promise<void> {
    await this.platformOwnerWalletService.clearWallet(id);
  }
}
