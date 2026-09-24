import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '../../entities/book.entity';
import { BookPromotion } from '../../entities/book-promotion.entity';
import { Library } from '../../entities/library.entity';
import { AuthModule } from '../../common/auth';
import { BooksModule } from '../books/books.module';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookPromotion, Book, Library]), AuthModule, BooksModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
