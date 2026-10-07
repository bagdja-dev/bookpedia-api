import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly } from '../../common/auth';
import { PlatformBuildsService } from './platform-builds.service';
import { CreatePlatformBuildConfigDto } from './dto/create-platform-build-config.dto';
import { CreatePlatformBuildJobDto } from './dto/create-platform-build-job.dto';
import { CreatePlatformKeystoreProfileDto } from './dto/create-platform-keystore-profile.dto';

const MAX_KEYSTORE_SIZE_BYTES = 10 * 1024 * 1024;

@ApiTags('Platform Builds')
@Controller('platform-builds')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformBuildsController {
  constructor(private readonly platformBuildsService: PlatformBuildsService) {}

  @Get('platforms/:platformId/keystore-profiles')
  @OwnerOnly()
  @ApiOperation({ summary: 'List signing profiles for a platform' })
  async listKeystoreProfiles(@Param('platformId') platformId: string) {
    return this.platformBuildsService.listKeystoreProfiles(platformId);
  }

  @Post('platforms/:platformId/keystore-profiles')
  @OwnerOnly()
  @ApiOperation({ summary: 'Upload a private JKS file and save its signing profile' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_KEYSTORE_SIZE_BYTES } }))
  async createKeystoreProfile(
    @Param('platformId') platformId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePlatformKeystoreProfileDto,
  ) {
    if (!file) throw new BadRequestException('File JKS wajib diunggah');
    if (!file.originalname.toLowerCase().endsWith('.jks')) {
      throw new BadRequestException('File keystore harus berekstensi .jks');
    }
    return this.platformBuildsService.uploadKeystoreProfile(platformId, dto, file);
  }

  @Get('platforms/:platformId/configs')
  @OwnerOnly()
  @ApiOperation({ summary: 'List build configs for a platform' })
  async listConfigs(@Param('platformId') platformId: string) {
    return this.platformBuildsService.listConfigs(platformId);
  }

  @Post('configs')
  @OwnerOnly()
  @ApiOperation({ summary: 'Create a build config for a platform' })
  async createConfig(@Body() dto: CreatePlatformBuildConfigDto) {
    return this.platformBuildsService.createConfig(dto);
  }

  @Post('jobs')
  @OwnerOnly()
  @ApiOperation({ summary: 'Queue a build job for a platform' })
  async createJob(@Body() dto: CreatePlatformBuildJobDto) {
    return this.platformBuildsService.queueBuild(dto);
  }

  @Get('jobs')
  @OwnerOnly()
  @ApiOperation({ summary: 'List build jobs' })
  async listJobs(@Query('platformId') platformId?: string) {
    return this.platformBuildsService.listJobs(platformId);
  }

  @Get('jobs/:jobId')
  @OwnerOnly()
  @ApiOperation({ summary: 'Detail a build job' })
  async getJob(@Param('jobId') jobId: string) {
    return this.platformBuildsService.getJob(jobId);
  }

  @Get('jobs/:jobId/status')
  @OwnerOnly()
  @ApiOperation({ summary: 'Refresh status and get current temporary artifact/log links' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.platformBuildsService.getJobStatus(jobId);
  }

}
