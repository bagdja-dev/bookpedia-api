import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Chapter } from '../../entities/chapter.entity';
import { Book } from '../../entities/book.entity';
import { Library } from '../../entities/library.entity';
import { AuthModule } from '../../common/auth';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Book, Library]), AuthModule, PlatformsModule, NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
