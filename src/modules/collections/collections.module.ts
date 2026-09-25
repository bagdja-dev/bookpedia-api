import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { Book } from '../../entities/book.entity';
import { BookCollection } from '../../entities/book-collection.entity';
import { BookTag } from '../../entities/book-tag.entity';
import { Category } from '../../entities/category.entity';
import { CollectionBook } from '../../entities/collection-book.entity';
import { Genre } from '../../entities/genre.entity';
import { Library } from '../../entities/library.entity';
import { Tag } from '../../entities/tag.entity';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookCollection, CollectionBook, Book, Library, Genre, Category, Tag, BookTag]), AuthModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
