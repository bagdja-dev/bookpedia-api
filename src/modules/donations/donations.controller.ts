import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  JwtAuthGuard,
  PlatformAccessGuard,
  type AuthUser,
} from '../../common/auth';
import { CreateDonationDto, DonationSettingsDto } from './dto/donation-settings.dto';
import { DonationListResponseDto } from './dto/donation-list.dto';
import { DonationsService } from './donations.service';

@ApiTags('Platform Donations')
@Controller('platforms')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformDonationSettingsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get(':id/donation-settings')
  @ApiOperation({ summary: 'Get donation settings for a Platform' })
  getSettings(@Param('id') platformId: string) {
    return this.donationsService.getSettings(platformId);
  }

  @Patch(':id/donation-settings')
  @ApiOperation({ summary: 'Update donation settings for a Platform' })
  updateSettings(@Param('id') platformId: string, @Body() dto: DonationSettingsDto) {
    return this.donationsService.updateSettings(platformId, dto);
  }

  @Get(':id/donations')
  @ApiOperation({ summary: 'List donations received by a Platform' })
  getDonations(
    @Param('id') platformId: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<DonationListResponseDto> {
    const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? '25', 10) || 25));
    return this.donationsService.listDonations(platformId, page, limit, search?.trim() ?? '', status);
  }
}

@ApiTags('Public Donations')
@Controller('public/platforms/:platformSlug')
export class PublicDonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('donations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a voluntary donation checkout for a Platform (login required)' })
  createDonation(
    @Param('platformSlug') platformSlug: string,
    @Body() dto: CreateDonationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.donationsService.createDonation(platformSlug, user, dto);
  }

  @Get('donations/status/:statusToken')
  @ApiOperation({ summary: 'Read donation checkout status using its opaque status token' })
  getStatus(
    @Param('platformSlug') platformSlug: string,
    @Param('statusToken') statusToken: string,
  ) {
    return this.donationsService.getDonationStatus(platformSlug, statusToken);
  }
}
