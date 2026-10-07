import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformBuildConfig } from '../../entities/platform-build-config.entity';
import type { PlatformBuildJob } from '../../entities/platform-build-job.entity';
import { PlatformKeystoreProfile } from '../../entities/platform-keystore-profile.entity';
import { Platform } from '../../entities/platform.entity';
import { StorageClientService } from '../storage/storage-client.service';
import { BuildQueueService } from './build-queue.service';
import { CreatePlatformBuildConfigDto } from './dto/create-platform-build-config.dto';
import { CreatePlatformKeystoreProfileDto } from './dto/create-platform-keystore-profile.dto';
import { CreatePlatformBuildJobDto } from './dto/create-platform-build-job.dto';

@Injectable()
export class PlatformBuildsService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(PlatformBuildConfig)
    private readonly buildConfigRepo: Repository<PlatformBuildConfig>,
    @InjectRepository(PlatformKeystoreProfile)
    private readonly keystoreProfileRepo: Repository<PlatformKeystoreProfile>,
    private readonly buildQueueService: BuildQueueService,
    private readonly storageClient: StorageClientService,
  ) {}

  async listConfigs(platformId: string) {
    return this.buildConfigRepo.find({
      where: { platform_id: platformId },
      order: { created_at: 'DESC' },
    });
  }

  async createConfig(dto: CreatePlatformBuildConfigDto) {
    const existing = await this.buildConfigRepo.findOne({
      where: { platform_id: dto.platformId, environment: dto.environment },
    });
    const config = this.buildConfigRepo.create({
      ...existing,
      platform_id: dto.platformId,
      environment: dto.environment,
      version_name: dto.versionName,
      version_code: dto.versionCode,
      keystore_profile_id: dto.keystoreProfileId ?? null,
      build_flags: dto.buildFlags ?? {},
    });

    return this.buildConfigRepo.save(config);
  }

  async listKeystoreProfiles(platformId: string) {
    return this.keystoreProfileRepo.find({
      where: { platform_id: platformId },
      order: { created_at: 'DESC' },
    });
  }

  async uploadKeystoreProfile(
    platformId: string,
    dto: CreatePlatformKeystoreProfileDto,
    file: Express.Multer.File,
  ) {
    const uploaded = await this.storageClient.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype || 'application/octet-stream',
      'platform-keystores',
      false,
    );

    const profile = this.keystoreProfileRepo.create({
      platform_id: platformId,
      name: dto.name,
      alias: dto.alias,
      file_ref: uploaded.path,
      storage_file_id: uploaded.id,
      password_secret_ref: dto.passwordSecretRef,
      key_password_secret_ref: dto.keyPasswordSecretRef,
      status: 'active',
    });

    return this.keystoreProfileRepo.save(profile);
  }

  async listJobs(platformId?: string) {
    if (!platformId) throw new BadRequestException('platformId is required');
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform not found');
    const runnerJobs = await this.buildQueueService.listJobs(platform.id, platform.slug);
    return runnerJobs.map((job) => ({
      id: job.id,
      platform_id: platform.id,
      config_id: null,
      external_job_id: job.id,
      status: job.status as PlatformBuildJob['status'],
      progress: job.progress,
      stage: job.stage,
      build_type: job.buildType ?? null,
      output_format: job.outputFormat ?? null,
      artifact_url: job.artifactUrl,
      log_url: job.logUrl,
      error_message: job.errorMessage,
      created_at: job.createdAt ?? job.updatedAt,
      started_at: job.startedAt ?? null,
      finished_at: job.finishedAt ?? null,
      updated_at: job.updatedAt,
    }));
  }

  async getJob(jobId: string) {
    return this.getJobStatus(jobId);
  }

  async getJobStatus(jobId: string) {
    const status = await this.buildQueueService.getStatus(jobId);
    return {
      id: status.id,
      external_job_id: status.id,
      status: status.status,
      progress: status.progress,
      stage: status.stage,
      build_type: status.buildType ?? null,
      output_format: status.outputFormat ?? null,
      error_message: status.errorMessage,
      artifact_url: status.artifactUrl,
      log_url: status.logUrl,
      created_at: status.createdAt ?? status.updatedAt,
      started_at: status.startedAt ?? null,
      finished_at: status.finishedAt ?? null,
      updated_at: new Date(status.updatedAt),
    };
  }

  async queueBuild(dto: CreatePlatformBuildJobDto) {
    const platform = await this.platformRepo.findOne({ where: { id: dto.platformId } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const config = dto.configId
      ? await this.buildConfigRepo.findOne({ where: { id: dto.configId, platform_id: dto.platformId } })
      : null;
    if (dto.configId && !config) {
      throw new NotFoundException('Build config not found for this platform');
    }
    const signingProfile = config?.keystore_profile_id
      ? await this.keystoreProfileRepo.findOne({
          where: { id: config.keystore_profile_id, platform_id: dto.platformId },
        })
      : null;
    const savedFlags = config?.build_flags ?? {};
    const appName = dto.appName ?? savedFlags.appName;
    const bundleId = dto.bundleId ?? savedFlags.bundleId;
    const targetUrl = dto.targetUrl ?? savedFlags.targetUrl;
    const iconUrl = dto.iconUrl ?? savedFlags.iconUrl;
    const splashImageUrl = dto.splashImageUrl ?? savedFlags.splashImageUrl;
    const theme = dto.theme ?? savedFlags.theme ?? {};
    if (typeof appName !== 'string' || typeof bundleId !== 'string' || typeof targetUrl !== 'string') {
      throw new BadRequestException('Build config must include appName, bundleId, and targetUrl');
    }

    const environment = config?.environment ?? 'prod';
    const buildType = dto.buildType ?? (environment === 'dev' ? 'debug' : 'release');
    const outputFormat = dto.outputFormat ?? (buildType === 'debug' ? 'apk' : 'aab');
    if (buildType === 'debug' && outputFormat === 'aab') {
      throw new BadRequestException('Build debug hanya mendukung format APK');
    }
    const buildConfig = {
      ...(dto.buildConfig ?? {
        environment,
        versionName: config?.version_name,
        versionCode: config?.version_code,
      }),
      buildType,
      outputFormat,
    };

    // Debug APKs are signed with the builder's debug key, so no keystore is sent.
    let signing: Record<string, unknown> | undefined;
    if (buildType === 'release') {
      if (!signingProfile) {
        throw new BadRequestException('Select a keystore profile saved for this platform');
      }
      signing = {
        fileUrl: signingProfile.storage_file_id
          ? await this.storageClient.createPrivateDownloadUrl(signingProfile.storage_file_id)
          : null,
        alias: signingProfile.alias,
        passwordSecretRef: signingProfile.password_secret_ref,
        keyPasswordSecretRef: signingProfile.key_password_secret_ref,
      };
      if (!signing.fileUrl || !signing.passwordSecretRef || !signing.keyPasswordSecretRef) {
        throw new BadRequestException('A private keystore profile with a storage file ID is required for signing');
      }
    }

    const dispatchResult = await this.buildQueueService.enqueue({
      tenantId: platform.slug,
      platformId: platform.id,
      payload: {
        appName,
        bundleId,
        targetUrl,
        iconUrl,
        splashImageUrl,
        theme,
        buildConfig,
        ...(signing ? { signing } : {}),
      },
    });

    if (!dispatchResult.externalJobId) throw new BadRequestException('TWA Builder returned no job ID');
    return this.getJobStatus(dispatchResult.externalJobId);
  }

  async getKeystoreProfiles() {
    return this.keystoreProfileRepo.find({ order: { created_at: 'DESC' } });
  }
}
