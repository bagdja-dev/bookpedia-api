import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Seperti `JwtAuthGuard`, tapi TIDAK menolak request tanpa token / token tidak valid —
 * request diteruskan sebagai anonim (`request.user` kosong). Dipakai endpoint publik yang
 * isinya bergantung pada login, mis. konten Chapter: Chapter gratis untuk semua, Chapter
 * di luar jatah gratis hanya untuk pembaca yang login (dicek di service).
 */
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof UnauthorizedException) return true;
      throw error;
    }
  }
}
