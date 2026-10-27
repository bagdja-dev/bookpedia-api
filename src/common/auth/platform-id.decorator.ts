import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Ambil `request.platformId` hasil `PlatformContextMiddleware` (header
 * `x-bookpedia-platform-slug` yang dikirim bookpedia-app lewat BFF proxy).
 *
 * SENGAJA FAIL-CLOSED: kalau konteks Platform tidak ada, request DITOLAK 400
 * — BUKAN diteruskan dengan `platformId = null`. Sebelum ini, `null` membuat
 * `findLibraryByOwner()` jatuh ke lookup TANPA filter `platform_id`, sehingga
 * user yang membuka Studio Platform B bisa melihat Library miliknya di
 * Platform A (bug nyata: masuk Studio `bizact` menampilkan Library `novello`).
 *
 * Dipakai HANYA di endpoint Studio yang datanya di-scope per-Platform
 * (Library, Book, Chapter, Series, Promotions). Endpoint publik tidak
 * memakainya — Platform-nya sudah eksplisit di path (`/public/platforms/:slug/...`).
 */
export const PlatformId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ platformId?: string | null }>();
    const platformId = request.platformId;

    if (!platformId) {
      throw new BadRequestException(
        'Konteks Platform tidak ditemukan. Request Studio wajib membawa header x-bookpedia-platform-slug yang valid.',
      );
    }

    return platformId;
  },
);
