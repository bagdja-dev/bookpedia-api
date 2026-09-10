import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly, CurrentUser, type AuthUser } from '../../common/auth';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { PlatformListResponseDto } from './dto/platform-list-response.dto';

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update branding/pengaturan Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: PlatformResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformDto): Promise<PlatformResponseDto> {
    const platform = await this.platformsService.update(id, dto);
    return this.platformsService.toResponseDto(platform);
  }
}
