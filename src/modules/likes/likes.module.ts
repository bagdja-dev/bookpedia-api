import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { ChapterLike } from '../../entities/chapter-like.entity';
import { AuthModule } from '../../common/auth';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterLike, Book, Chapter, Library]), AuthModule, PlatformsModule, NotificationsModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
