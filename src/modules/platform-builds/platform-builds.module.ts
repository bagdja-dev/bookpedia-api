import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { PlatformBuildConfig } from '../../entities/platform-build-config.entity';
import { PlatformKeystoreProfile } from '../../entities/platform-keystore-profile.entity';
import { Platform } from '../../entities/platform.entity';
import { StorageModule } from '../storage/storage.module';
import { BuildQueueService } from './build-queue.service';
import { BuildWorkerService } from './build-worker.service';
import { PlatformBuildsController } from './platform-builds.controller';
import { KeystoreSecretsService } from './keystore-secrets.service';
import { PlatformBuildsService } from './platform-builds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Platform, PlatformBuildConfig, PlatformKeystoreProfile]),
    AuthModule,
    StorageModule,
  ],
  controllers: [PlatformBuildsController],
  providers: [PlatformBuildsService, BuildQueueService, BuildWorkerService, KeystoreSecretsService],
  exports: [PlatformBuildsService, BuildQueueService],
})
export class PlatformBuildsModule {}
