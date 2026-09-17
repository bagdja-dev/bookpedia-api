import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Chapter } from '../../entities/chapter.entity';
import { AuthModule } from '../../common/auth';
import { ChatServiceModule } from '../../common/chat-service/chat-service.module';
import { BooksModule } from '../books/books.module';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter]), AuthModule, BooksModule, ChatServiceModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
