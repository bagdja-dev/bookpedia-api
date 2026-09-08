import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from '../../modules/user/user.module';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, UserModule],
})
export class AuthModule {}
