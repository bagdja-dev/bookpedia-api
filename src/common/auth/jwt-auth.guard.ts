import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthProfileService } from '../../modules/user/auth-profile.service';
import type { AuthUser } from './auth-user';

/**
 * Guard login wajib untuk endpoint Studio (penulis) & endpoint reader yang
 * butuh identitas (Fase 3+). MVP Bookpedia solo-owner per Library — TIDAK ada
 * TenantStaffGuard/RolesGuard seperti bagdja-website-api, cukup guard ini +
 * `CurrentUser` untuk dapat `userId` yang login (lihat execution-plan.md
 * Fase 0).
 *
 * Bookpedia adalah produk pihak ketiga di platform Bagdja: TIDAK memegang
 * secret platform (`JWT_SECRET`), jadi tidak pernah verifikasi HS256 dengan
 * key bersama (plan/payment-service/caller-identity-hardening-plan.md S19).
 * Urutan (sama dengan bagdja-website-api):
 * 1) JWKS stateless bagdja-auth (token OAuth EdDSA dari SSO) — jalur normal
 * 2) fallback introspeksi `/auth/me` pakai client token app sendiri
 *
 * Profile lokal di-upsert setelah token valid sebagai projection untuk
 * observability/admin. Source of truth identitas tetap bagdja-auth.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authProfile: AuthProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    let authUser: AuthUser | null =
      await this.authProfile.validateTokenViaJwks(token);

    if (!authUser) {
      authUser = await this.authProfile.validateToken(`Bearer ${token}`);
    }

    if (!authUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    try {
      await this.authProfile.syncUserProfile(authUser);
    } catch (error) {
      // Profile projection is observability data; it must not block valid login.
      this.authProfile.logProfileSyncFailure(error);
    }

    request.user = authUser;
    return true;
  }

  private extractToken(request: { headers?: Record<string, string | string[] | undefined>; query?: Record<string, string> }): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader) {
      const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      const [type, token] = header.split(' ');
      if (type === 'Bearer' && token) return token;
    }

    const queryToken = request.query?.auth_token;
    if (queryToken) return queryToken;

    return null;
  }
}
