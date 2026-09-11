import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Genre } from '../../entities/genre.entity';
import { AuthModule } from '../../common/auth';
import { PlatformsModule } from '../platforms/platforms.module';
import { GenresController } from './genres.controller';
import { GenresPublicController } from './genres-public.controller';
import { GenresService } from './genres.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), AuthModule, PlatformsModule],
  controllers: [GenresController, GenresPublicController],
  providers: [GenresService],
  // Diexport supaya BooksModule bisa reuse untuk validasi genreId saat create/update Book.
  exports: [GenresService],
})
export class GenresModule {}
