import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformStaff } from '../../entities';
import { AuthProfileService } from '../../modules/user/auth-profile.service';
import type { AuthUser } from './jwt.strategy';
import { OWNER_ONLY_KEY } from './owner-only.decorator';

interface ClientAppMeResponse {
  id: string;
  [key: string]: unknown;
}

interface ValidateOwnershipResponse {
  isValid: boolean;
  organizationId: string;
  message: string;
}

interface CachedOwnership {
  value: ValidateOwnershipResponse;
  expiresAt: number;
}

const OWNERSHIP_CACHE_TTL_MS = 60_000;
/** Batas kasar jumlah token unik yang di-cache sekaligus — dibuang semua kalau kepenuhan. */
const OWNERSHIP_CACHE_MAX_SIZE = 500;

function extractBearerToken(request: {
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  const header = request.headers?.authorization;
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  const [type, token] = value.split(' ');
  return type === 'Bearer' && token ? token : null;
}

/**
 * Port dari `AppAccessGuard` bagdja-auction-api (§4.1, 10 Sep 2026) — guard
 * role PERTAMA di codebase `bagdja-novelo-api` (sebelumnya cuma ada pola
 * lookup kepemilikan per-service, lihat `LibrariesService.findLibraryByOwner`).
 * Menentukan apakah user yang sudah lolos `JwtAuthGuard` adalah **Owner**
 * (anggota organisasi bagdja-auth pemilik client_app Novelo) atau **Staff**
 * (tercatat aktif di `platform_staff` untuk Platform tertentu). HARUS
 * dipasang SETELAH `JwtAuthGuard` di `@UseGuards()` (butuh `request.user`).
 *
 * Algoritma (identik `AppAccessGuard`, lihat plan/novelo/execution-plan.md
 * §4.1 checklist "AppAccessGuard-equivalent"):
 * 1. Client-credential token Novelo sendiri (`POST /auth/client`) — REUSE
 *    `AuthProfileService.getClientToken()` (novelo-api sudah punya cache ini
 *    untuk keperluan verifikasi token user, dipakai ulang di sini daripada
 *    diduplikasi).
 * 2. Resolve UUID PK client_app sendiri (`GET /auth/client/me`) — cache
 *    seumur proses, refresh kalau request berikutnya gagal 401.
 * 3. Validate ownership user yang login (`GET
 *    /auth/client/:clientAppId/validate-ownership`) — cache per-token user,
 *    TTL 60 detik.
 *
 * Kalau `isValid === true` → Owner, selalu lolos, `request.platformAccess =
 * { isOwner: true, organizationId }`. Kalau bukan Owner: endpoint
 * `@OwnerOnly()` → `ForbiddenException`; endpoint biasa → resolve
 * `platform_id` dari `:platformId`/`:id` dan cek `platform_staff`.
 *
 * **Endpoint tanpa target Platform spesifik** (mis. `GET /platforms` list,
 * tidak ada route param): guard SENGAJA tidak melempar `ForbiddenException`
 * kalau `platform_id` tidak bisa di-resolve dari params — cukup lolos,
 * scoping data jadi tanggung jawab service (`PlatformsService.findMine`).
 */
@Injectable()
export class PlatformAccessGuard implements CanActivate {
  private readonly authApiUrl: string;

  /** UUID PK client_app sendiri — jarang berubah, cache seumur proses (refresh kalau 401). */
  private ownClientAppUuid: string | null = null;
  private readonly ownershipCache = new Map<string, CachedOwnership>();

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly authProfile: AuthProfileService,
    @InjectRepository(PlatformStaff)
    private readonly platformStaffRepo: Repository<PlatformStaff>,
  ) {
    this.authApiUrl = (
      this.config.get<string>('BAGDJA_AUTH_API') || 'http://localhost:4001'
    ).replace(/\/$/, '');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user?.userId) {
      throw new ForbiddenException('User authentication required before platform access check');
    }

    const userJwt = extractBearerToken(request);
    if (!userJwt) {
      throw new ForbiddenException('User authentication required before platform access check');
    }

    const ownership = await this.validateOwnership(userJwt);
    const isOwner = ownership.isValid === true;

    request.platformAccess = { isOwner, organizationId: ownership.organizationId };

    if (isOwner) {
      return true;
    }

    const ownerOnly = this.reflector.getAllAndOverride<boolean>(OWNER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (ownerOnly) {
      throw new ForbiddenException('This action is restricted to the Platform Owner');
    }

    const platformId: string | undefined = request.params?.platformId || request.params?.id;

    if (!platformId) {
      // Lihat catatan di docblock kelas — endpoint list tanpa target
      // Platform spesifik menyerahkan scoping data ke service.
      return true;
    }

    const staff = await this.platformStaffRepo.findOne({
      where: { platform_id: platformId, user_id: user.userId, is_active: true },
    });

    if (!staff) {
      throw new ForbiddenException('You do not have access to this platform');
    }

    request.platformStaff = staff;
    return true;
  }

  // ─── Langkah 2: resolve UUID PK client_app sendiri ─────────────────

  private async getOwnClientAppId(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.ownClientAppUuid) {
      return this.ownClientAppUuid;
    }

    const token = await this.authProfile.getClientToken();
    if (!token) {
      throw new ForbiddenException('Novelo client credentials are not configured');
    }

    const res = await fetch(`${this.authApiUrl}/auth/client/me`, {
      headers: { 'x-api-token': token },
    });

    if (!res.ok) {
      throw new ForbiddenException('Failed to resolve Novelo client_app identity from bagdja-auth');
    }

    const data = (await res.json()) as ClientAppMeResponse;
    this.ownClientAppUuid = data.id;
    return this.ownClientAppUuid;
  }

  // ─── Langkah 3: validate ownership user yang login ─────────────────

  private async validateOwnership(userJwt: string): Promise<ValidateOwnershipResponse> {
    const cached = this.getFreshCachedOwnership(userJwt);
    if (cached) return cached;

    const result = await this.callValidateOwnership(userJwt);
    this.setCachedOwnership(userJwt, result);
    return result;
  }

  private async callValidateOwnership(
    userJwt: string,
    isRetry = false,
  ): Promise<ValidateOwnershipResponse> {
    let token: string | null;
    let clientAppId: string;

    try {
      [token, clientAppId] = await Promise.all([
        this.authProfile.getClientToken(),
        this.getOwnClientAppId(isRetry),
      ]);
    } catch {
      throw new ForbiddenException('Failed to validate platform ownership with bagdja-auth');
    }

    if (!token) {
      throw new ForbiddenException('Failed to validate platform ownership with bagdja-auth');
    }

    const res = await fetch(`${this.authApiUrl}/auth/client/${clientAppId}/validate-ownership`, {
      headers: {
        'x-api-token': token,
        Authorization: `Bearer ${userJwt}`,
      },
    });

    if (res.ok) {
      return (await res.json()) as ValidateOwnershipResponse;
    }

    // clientAppId bisa jadi stale (mis. client app di-rotate) — paksa
    // refresh sekali lalu retry, bukan langsung gagal.
    if (res.status === 401 && !isRetry) {
      this.ownClientAppUuid = null;
      return this.callValidateOwnership(userJwt, true);
    }

    throw new ForbiddenException('Failed to validate platform ownership with bagdja-auth');
  }

  private getFreshCachedOwnership(token: string): ValidateOwnershipResponse | null {
    const entry = this.ownershipCache.get(token);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.ownershipCache.delete(token);
      return null;
    }
    return entry.value;
  }

  private setCachedOwnership(token: string, value: ValidateOwnershipResponse): void {
    if (this.ownershipCache.size >= OWNERSHIP_CACHE_MAX_SIZE) {
      this.ownershipCache.clear();
    }
    this.ownershipCache.set(token, { value, expiresAt: Date.now() + OWNERSHIP_CACHE_TTL_MS });
  }
}
