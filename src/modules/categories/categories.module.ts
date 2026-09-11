import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../../entities/category.entity';
import { GenreCategory } from '../../entities/genre-category.entity';
import { Genre } from '../../entities/genre.entity';
import { AuthModule } from '../../common/auth';
import { PlatformsModule } from '../platforms/platforms.module';
import { GenresModule } from '../genres/genres.module';
import { CategoriesController } from './categories.controller';
import { CategoriesPublicController } from './categories-public.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, GenreCategory, Genre]),
    AuthModule,
    PlatformsModule,
    GenresModule,
  ],
  controllers: [CategoriesController, CategoriesPublicController],
  providers: [CategoriesService],
  // Diexport supaya BooksModule bisa reuse untuk validasi categoryId saat create/update Book.
  exports: [CategoriesService],
})
export class CategoriesModule {}
