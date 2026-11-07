import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
    return this.donationsService.createDonation(platformSlug, user.userId, dto);
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
