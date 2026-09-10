import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { PlatformStaffInvitation } from '../../entities/platform-staff-invitation.entity';
import { AuthModule } from '../../common/auth';
import { PlatformStaffController, PlatformInvitationAcceptController } from './platform-staff.controller';
import { PlatformStaffService } from './platform-staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([Platform, PlatformStaff, PlatformStaffInvitation]), AuthModule],
  controllers: [PlatformStaffController, PlatformInvitationAcceptController],
  providers: [PlatformStaffService],
})
export class PlatformStaffModule {}
