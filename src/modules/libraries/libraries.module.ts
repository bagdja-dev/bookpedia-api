import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Library } from '../../entities/library.entity';
import { AuthModule } from '../../common/auth';
import { PlatformsModule } from '../platforms/platforms.module';
import { LibrariesController } from './libraries.controller';
import { LibrariesService } from './libraries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Library]), AuthModule, PlatformsModule],
  controllers: [LibrariesController],
  providers: [LibrariesService],
  exports: [LibrariesService],
})
export class LibrariesModule {}
