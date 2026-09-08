import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Library } from '../entities';

// CATATAN: tidak ada entity `User`/tabel `users` lokal di Novelo (beda dari
// bagdja-website-api/bagdja-auction-api) — lihat schema.dbml root Note pada
// Table `users`: "ID eksternal dari bagdja-auth — representasi visual saja,
// bukan tabel lokal". Identitas sepenuhnya milik bagdja-auth, JwtAuthGuard
// di sini tidak melakukan upsert ke DB lokal (lihat common/auth/jwt-auth.guard.ts).
const entities = [Library];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
