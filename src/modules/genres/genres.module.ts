import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Genre } from '../../entities/genre.entity';
import { PlatformsModule } from '../platforms/platforms.module';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), PlatformsModule],
  controllers: [GenresController],
  providers: [GenresService],
  // Diexport supaya BooksModule bisa reuse untuk validasi genreId saat create/update Book.
  exports: [GenresService],
})
export class GenresModule {}
