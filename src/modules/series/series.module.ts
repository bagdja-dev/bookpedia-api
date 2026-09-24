import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { BookSeries } from '../../entities/book-series.entity';
import { Library } from '../../entities/library.entity';
import { Series } from '../../entities/series.entity';
import { AuthModule } from '../../common/auth';
import { LibrariesModule } from '../libraries/libraries.module';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [TypeOrmModule.forFeature([Series, BookSeries, Book, Library]), LibrariesModule, AuthModule],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}
