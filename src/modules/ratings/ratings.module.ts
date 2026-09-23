import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { BookRating } from '../../entities/book-rating.entity';
import { AuthModule } from '../../common/auth';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookRating, Book, Chapter, Library]), AuthModule, PlatformsModule, NotificationsModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
