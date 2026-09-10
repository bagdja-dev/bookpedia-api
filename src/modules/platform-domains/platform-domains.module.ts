import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Platform } from '../../entities/platform.entity';
import { AuthModule } from '../../common/auth';
import { PlatformDomainsController } from './platform-domains.controller';
import { PlatformDomainsService } from './platform-domains.service';
import { TraefikConfigController } from './traefik-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Platform]), AuthModule],
  controllers: [PlatformDomainsController, TraefikConfigController],
  providers: [PlatformDomainsService],
})
export class PlatformDomainsModule {}
