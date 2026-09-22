import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Library } from '../../entities/library.entity';
import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { AuthModule } from '../../common/auth';
import { ChatServiceModule } from '../../common/chat-service/chat-service.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { LibrariesController } from './libraries.controller';
import { LibrariesService } from './libraries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Library, Book, Chapter]), AuthModule, PlatformsModule, ChatServiceModule],
  controllers: [LibrariesController],
  providers: [LibrariesService],
  exports: [LibrariesService],
})
export class LibrariesModule {}
