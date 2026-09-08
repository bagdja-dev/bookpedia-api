import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { ChapterHighlight } from '../../entities/chapter-highlight.entity';
import { AuthModule } from '../../common/auth';
import { ChapterHighlightsController } from './chapter-highlights.controller';
import { HighlightsController } from './highlights.controller';
import { HighlightsService } from './highlights.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterHighlight, Chapter, Book]), AuthModule],
  controllers: [ChapterHighlightsController, HighlightsController],
  providers: [HighlightsService],
})
export class HighlightsModule {}
