import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { ReadingProgress } from '../../entities/reading-progress.entity';
import { PlatformsModule } from '../platforms/platforms.module';
import { TagsModule } from '../tags/tags.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Chapter, Library, ReadingProgress]), PlatformsModule, TagsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
