import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { Donation } from '../../entities/donation.entity';
import { Platform } from '../../entities/platform.entity';
import { UserModule } from '../user/user.module';
import { DonationsService } from './donations.service';
import { PlatformDonationSettingsController, PublicDonationsController } from './donations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Donation, Platform]), AuthModule, UserModule],
  controllers: [PlatformDonationSettingsController, PublicDonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
