import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Library, Platform, PlatformBuildJob, PlatformStaff } from '../../entities';
import { UserModule } from '../../modules/user/user.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { PlatformAccessGuard } from './platform-access.guard';

// Di-assign ke variabel supaya bisa di-`exports` juga (bukan cuma `imports`)
// — modul yang cuma `imports: [AuthModule]` untuk pakai PlatformAccessGuard
// (mis. PlatformDomainsModule) butuh token PlatformStaffRepository ini ikut
// keekspor, kalau tidak NestJS gagal resolve dependency guard tsb di
// context modul konsumen ("Nest can't resolve dependencies of the
// PlatformAccessGuard ... PlatformStaffRepository").
const PlatformAccessTypeOrmModule = TypeOrmModule.forFeature([PlatformStaff, Platform, Library, PlatformBuildJob]);

@Module({
  imports: [ConfigModule, UserModule, PlatformAccessTypeOrmModule],
  providers: [JwtAuthGuard, OptionalJwtAuthGuard, PlatformAccessGuard],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, PlatformAccessGuard, UserModule, PlatformAccessTypeOrmModule],
})
export class AuthModule {}
