import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Genre } from '../../entities/genre.entity';
import { Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { AuthModule } from '../../common/auth';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Platform, PlatformStaff, Genre]), AuthModule],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  // Diexport supaya LibrariesModule bisa reuse untuk resolve+validasi
  // platformId saat create Library.
  exports: [PlatformsService],
})
export class PlatformsModule {}
