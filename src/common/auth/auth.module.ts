import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformStaff } from '../../entities';
import { UserModule } from '../../modules/user/user.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PlatformAccessGuard } from './platform-access.guard';

// Di-assign ke variabel supaya bisa di-`exports` juga (bukan cuma `imports`)
// — modul yang cuma `imports: [AuthModule]` untuk pakai PlatformAccessGuard
// (mis. PlatformDomainsModule) butuh token PlatformStaffRepository ini ikut
// keekspor, kalau tidak NestJS gagal resolve dependency guard tsb di
// context modul konsumen ("Nest can't resolve dependencies of the
// PlatformAccessGuard ... PlatformStaffRepository").
const PlatformStaffTypeOrmModule = TypeOrmModule.forFeature([PlatformStaff]);

@Module({
  imports: [ConfigModule, UserModule, PlatformStaffTypeOrmModule],
  providers: [JwtAuthGuard, PlatformAccessGuard],
  exports: [JwtAuthGuard, PlatformAccessGuard, UserModule, PlatformStaffTypeOrmModule],
})
export class AuthModule {}
