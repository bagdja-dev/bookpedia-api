import { Module } from '@nestjs/common';

import { AuthProfileService } from './auth-profile.service';

// Sengaja bernama "user" (bukan "auth-profile") untuk konsistensi penamaan
// dengan bagdja-website-api/bagdja-auction-api — tapi TIDAK ada UserService/
// entity User lokal di sini (lihat catatan di database/database.module.ts).
// Modul ini murni menyediakan AuthProfileService (validasi token JWKS/
// `/auth/me`) untuk dipakai JwtAuthGuard.
@Module({
  providers: [AuthProfileService],
  exports: [AuthProfileService],
})
export class UserModule {}
