import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { PlatformsService } from '../../modules/platforms/platforms.service';

/**
 * Middleware multi-tenant: baca header `x-bookpedia-platform-slug` (dikirim
 * oleh bookpedia-app middleware.ts lewat BFF proxy), resolve ke Platform
 * entity, dan pasang `request.platformId` sehingga service (mis.
 * LibrariesService.findLibraryByOwner) bisa scope data per-Platform.
 *
 * Kalau header tidak ada (mis. panggilan langsung tanpa konteks Platform,
 * atau legacy client), `request.platformId` = null dan scoping data di-serah-
 * kan ke service (backward-compatible: findLibraryByOwner tidak filter
 * platform_id kalau platformId null).
 *
 * Kalau header ada TAPI slug tidak valid / Platform tidak aktif → 404
 * (jangan diam-diam fallback ke default, supaya tidak ada data yang bocor
 * ke Platform salah).
 */
@Injectable()
export class PlatformContextMiddleware implements NestMiddleware {
  constructor(private readonly platformsService: PlatformsService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const slug = req.headers['x-bookpedia-platform-slug'];
    const slugStr = Array.isArray(slug) ? slug[0] : slug;

    if (!slugStr) {
      (req as any).platformId = null;
      return next();
    }

    const platform = await this.platformsService.findBySlug(slugStr.trim());
    if (!platform || !platform.is_active) {
      throw new NotFoundException(`Platform "${slugStr}" tidak ditemukan atau tidak aktif`);
    }

    (req as any).platformId = platform.id;
    next();
  }
}
