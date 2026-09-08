import { Module } from '@nestjs/common';

import { AuthModule } from '../../common/auth';
import { StorageModule } from '../storage/storage.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
