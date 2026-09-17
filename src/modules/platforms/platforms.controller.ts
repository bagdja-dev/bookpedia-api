import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly, CurrentUser, type AuthUser } from '../../common/auth';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { PlatformListResponseDto } from './dto/platform-list-response.dto';
import { PlatformUserActivityResponseDto } from './dto/platform-user-activity.dto';

interface RequestWithPlatformAccess extends Request {
  platformAccess?: { isOwner: boolean; organizationId?: string };
}

@ApiTags('Platforms')
@Controller('platforms')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat Platform baru (Owner only) — auto-seed 11 genre default' })
  @ApiOkResponse({ type: PlatformResponseDto, description: 'Platform berhasil dibuat' })
  async create(@Body() dto: CreatePlatformDto): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.create(dto);
    return this.platformsService.toResponseDto(platform);
  }

  @Get()
  @ApiOperation({
    summary: 'Platform switcher — list Platform untuk user login',
    description: 'Owner lihat SEMUA Platform (org-wide). Staff cuma lihat Platform yang dia punya row aktif di platform_staff.',
  })
  @ApiOkResponse({ type: PlatformListResponseDto })
  async findMine(
    @CurrentUser() user: AuthUser,
    @Req() req: RequestWithPlatformAccess,
  ): Promise<PlatformListResponseDto> {
    const isOwner = req.platformAccess?.isOwner ?? false;
    const platforms = await this.platformsService.findMine(user.userId, isOwner);
    return { isOwner, platforms: platforms.map((p) => this.platformsService.toResponseDto(p)) };
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
  async listUsers(
    @Param('id') id: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('search') search?: string,
  ): Promise<PlatformUserActivityResponseDto> {
    const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? '25', 10) || 25));
    return this.platformsService.listUserActivity(id, page, limit, search?.trim() ?? '');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branding/pengaturan Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: PlatformResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformDto): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.update(id, dto);
    return this.platformsService.toResponseDto(platform);
  }
}
