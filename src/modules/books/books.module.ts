import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { AuthModule } from '../../common/auth';
import { LibrariesModule } from '../libraries/libraries.module';
import { GenresModule } from '../genres/genres.module';
import { CategoriesModule } from '../categories/categories.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), AuthModule, LibrariesModule, GenresModule, CategoriesModule],
  controllers: [BooksController],
  providers: [BooksService],
  // Diexport supaya ChaptersModule bisa reuse `findOneForOwner()` untuk
  // scoping `bookId` di route nested /books/:bookId/chapters.
  exports: [BooksService],
})
export class BooksModule {}
