import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformBuildConfig } from '../../entities/platform-build-config.entity';
import type { PlatformBuildJob } from '../../entities/platform-build-job.entity';
import { PlatformKeystoreProfile } from '../../entities/platform-keystore-profile.entity';
import { Platform } from '../../entities/platform.entity';
import { normalizeSha256Fingerprints } from '../platforms/platforms.service';
import { StorageClientService } from '../storage/storage-client.service';
import { BuildQueueService, type BuilderJobStatusResponse } from './build-queue.service';
import { CreatePlatformBuildConfigDto } from './dto/create-platform-build-config.dto';
import { CreatePlatformKeystoreProfileDto } from './dto/create-platform-keystore-profile.dto';
import { CreatePlatformBuildJobDto } from './dto/create-platform-build-job.dto';
import { KeystorePasswordsDto } from './dto/keystore-passwords.dto';
import { PlatformKeystoreProfileResponseDto } from './dto/platform-keystore-profile-response.dto';
import { KeystoreSecretsService } from './keystore-secrets.service';

@Injectable()
export class PlatformBuildsService {
  private readonly logger = new Logger(PlatformBuildsService.name);

  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(PlatformBuildConfig)
    private readonly buildConfigRepo: Repository<PlatformBuildConfig>,
    @InjectRepository(PlatformKeystoreProfile)
    private readonly keystoreProfileRepo: Repository<PlatformKeystoreProfile>,
    private readonly buildQueueService: BuildQueueService,
    private readonly storageClient: StorageClientService,
    private readonly keystoreSecrets: KeystoreSecretsService,
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

  async listKeystoreProfiles(platformId: string): Promise<PlatformKeystoreProfileResponseDto[]> {
    const profiles = await this.keystoreProfileRepo.find({
      where: { platform_id: platformId },
      order: { created_at: 'DESC' },
    });
    return profiles.map((profile) => this.toKeystoreProfileResponse(profile));
  }

  /** Membuka password terenkripsi untuk dilihat Owner (satu-satunya jalur baca password). */
  async revealKeystorePasswords(platformId: string, profileId: string): Promise<KeystorePasswordsDto> {
    const profile = await this.findKeystoreProfile(platformId, profileId);
    if (!profile.store_password_encrypted || !profile.key_password_encrypted) {
      throw new NotFoundException('Profil keystore ini belum punya password tersimpan');
    }
    const aad = this.keystoreAad(profile);
    return {
      storePassword: this.keystoreSecrets.decrypt(profile.store_password_encrypted, aad),
      keyPassword: this.keystoreSecrets.decrypt(profile.key_password_encrypted, aad),
    };
  }

  async updateKeystorePasswords(
    platformId: string,
    profileId: string,
    dto: KeystorePasswordsDto,
  ): Promise<PlatformKeystoreProfileResponseDto> {
    const profile = await this.findKeystoreProfile(platformId, profileId);
    this.applyEncryptedPasswords(profile, dto);
    return this.toKeystoreProfileResponse(await this.keystoreProfileRepo.save(profile));
  }

  private async findKeystoreProfile(platformId: string, profileId: string): Promise<PlatformKeystoreProfile> {
    const profile = await this.keystoreProfileRepo.findOne({ where: { id: profileId, platform_id: platformId } });
    if (!profile) throw new NotFoundException('Keystore profile not found for this platform');
    return profile;
  }

  private keystoreAad(profile: PlatformKeystoreProfile): string {
    return `platform:${profile.platform_id}`;
  }

  private applyEncryptedPasswords(profile: PlatformKeystoreProfile, dto: KeystorePasswordsDto): void {
    const aad = this.keystoreAad(profile);
    profile.store_password_encrypted = this.keystoreSecrets.encrypt(dto.storePassword, aad);
    profile.key_password_encrypted = this.keystoreSecrets.encrypt(dto.keyPassword, aad);
    profile.password_secret_ref = null;
    profile.key_password_secret_ref = null;
  }

  private toKeystoreProfileResponse(profile: PlatformKeystoreProfile): PlatformKeystoreProfileResponseDto {
    return {
      id: profile.id,
      platform_id: profile.platform_id,
      name: profile.name,
      alias: profile.alias,
      status: profile.status,
      has_passwords: Boolean(
        (profile.store_password_encrypted && profile.key_password_encrypted)
        || (profile.password_secret_ref && profile.key_password_secret_ref),
      ),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
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
      status: 'active',
    });
    this.applyEncryptedPasswords(profile, dto);

    return this.toKeystoreProfileResponse(await this.keystoreProfileRepo.save(profile));
  }

  async listJobs(platformId?: string) {
    if (!platformId) throw new BadRequestException('platformId is required');
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform not found');
    const runnerJobs = await this.buildQueueService.listJobs(platform.id, platform.slug);
    await this.syncAndroidAssetLinks(platform, runnerJobs);
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
      bundle_id: job.bundleId ?? null,
      signing_cert_sha256: job.signingCertSha256 ?? null,
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
    if (status.platformId && status.status === 'success' && status.signingCertSha256) {
      const platform = await this.platformRepo.findOne({ where: { id: status.platformId } });
      if (platform) await this.syncAndroidAssetLinks(platform, [status]);
    }
    return {
      id: status.id,
      external_job_id: status.id,
      status: status.status,
      progress: status.progress,
      stage: status.stage,
      build_type: status.buildType ?? null,
      output_format: status.outputFormat ?? null,
      bundle_id: status.bundleId ?? null,
      signing_cert_sha256: status.signingCertSha256 ?? null,
      error_message: status.errorMessage,
      artifact_url: status.artifactUrl,
      log_url: status.logUrl,
      created_at: status.createdAt ?? status.updatedAt,
      started_at: status.startedAt ?? null,
      finished_at: status.finishedAt ?? null,
      updated_at: new Date(status.updatedAt),
    };
  }

  /**
   * Android App Links otomatis: setiap build sukses membawa SHA-256 sertifikat
   * penanda tangannya dari builder. Fingerprint itu ditambahkan ke
   * `platforms.android_sha256_cert_fingerprints` (tanpa menghapus yang sudah ada,
   * mis. Play App Signing yang diisi manual), dan `android_package_name` diisi dari
   * bundle ID build bila masih kosong — supaya `/.well-known/assetlinks.json`
   * langsung valid tanpa salin-tempel. Build dengan bundle ID berbeda dari package
   * name yang sudah tersimpan diabaikan (satu Platform = satu app Android).
   */
  private async syncAndroidAssetLinks(platform: Platform, jobs: BuilderJobStatusResponse[]): Promise<void> {
    const candidates = jobs.filter(
      (job) => job.status === 'success' && job.signingCertSha256 && job.bundleId,
    );
    if (!candidates.length) return;

    let packageName = platform.android_package_name;
    const fingerprints = new Set(platform.android_sha256_cert_fingerprints ?? []);
    let changed = false;
    for (const job of candidates) {
      if (!packageName) {
        packageName = job.bundleId!;
        changed = true;
      }
      if (job.bundleId !== packageName) continue;
      try {
        const [fingerprint] = normalizeSha256Fingerprints([job.signingCertSha256!]);
        if (!fingerprints.has(fingerprint)) {
          fingerprints.add(fingerprint);
          changed = true;
        }
      } catch {
        this.logger.warn(`Builder job ${job.id} returned an invalid signing certificate fingerprint`);
      }
    }
    if (!changed) return;

    platform.android_package_name = packageName;
    platform.android_sha256_cert_fingerprints = [...fingerprints].slice(0, 10);
    await this.platformRepo.save(platform);
    this.logger.log(`Android App Links updated for platform ${platform.slug}: ${packageName} (${fingerprints.size} fingerprint)`);
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
      if (!signingProfile.storage_file_id) {
        throw new BadRequestException('A private keystore profile with a storage file ID is required for signing');
      }
      // Password didekripsi sesaat sebelum dikirim ke builder (HTTPS); builder mengenkripsinya
      // lagi selama job antre dan menghapusnya setelah job selesai. Profil lama memakai secret ref.
      let passwords: Record<string, string | null>;
      if (signingProfile.store_password_encrypted && signingProfile.key_password_encrypted) {
        const revealed = await this.revealKeystorePasswords(dto.platformId, signingProfile.id);
        passwords = { storePassword: revealed.storePassword, keyPassword: revealed.keyPassword };
      } else if (signingProfile.password_secret_ref && signingProfile.key_password_secret_ref) {
        passwords = {
          passwordSecretRef: signingProfile.password_secret_ref,
          keyPasswordSecretRef: signingProfile.key_password_secret_ref,
        };
      } else {
        throw new BadRequestException('Simpan password keystore di profil ini sebelum build release');
      }
      signing = {
        fileUrl: await this.storageClient.createPrivateDownloadUrl(signingProfile.storage_file_id),
        alias: signingProfile.alias,
        ...passwords,
      };
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

  async getKeystoreProfiles(): Promise<PlatformKeystoreProfileResponseDto[]> {
    const profiles = await this.keystoreProfileRepo.find({ order: { created_at: 'DESC' } });
    return profiles.map((profile) => this.toKeystoreProfileResponse(profile));
  }
}
