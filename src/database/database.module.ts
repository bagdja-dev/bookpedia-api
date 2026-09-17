import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Library, Book, Chapter, User } from '../entities';

// `User` adalah projection/cache profile untuk kebutuhan observability dan
// admin. Source of truth identitas tetap bagdja-auth; user_id pada domain
// tables tetap merujuk ke external_user_id, bukan FK ke profile projection.
const entities = [Library, Book, Chapter, User];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
