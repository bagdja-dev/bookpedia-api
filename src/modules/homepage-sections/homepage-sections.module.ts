import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { Book } from '../../entities/book.entity';
import { HomepageSectionBook } from '../../entities/homepage-section-book.entity';
import { Library } from '../../entities/library.entity';
import { Platform } from '../../entities/platform.entity';
import { PlatformStaff } from '../../entities/platform-staff.entity';
import { HomepageSectionsController } from './homepage-sections.controller';
import { HomepageSectionsService } from './homepage-sections.service';

@Module({
  imports: [TypeOrmModule.forFeature([HomepageSectionBook, Platform, Book, Library, PlatformStaff]), AuthModule],
  controllers: [HomepageSectionsController],
  providers: [HomepageSectionsService],
})
export class HomepageSectionsModule {}
