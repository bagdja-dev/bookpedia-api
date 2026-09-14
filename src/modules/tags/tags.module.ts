import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tag } from '../../entities/tag.entity';
import { BookTag } from '../../entities/book-tag.entity';
import { PlatformsModule } from '../platforms/platforms.module';
import { TagsPublicController } from './tags-public.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, BookTag]), PlatformsModule],
  controllers: [TagsPublicController],
  providers: [TagsService],
  // Diexport supaya BooksModule & PublicModule bisa reuse (find-or-create saat simpan Book, batch-fetch saat tampilkan katalog).
  exports: [TagsService],
})
export class TagsModule {}
