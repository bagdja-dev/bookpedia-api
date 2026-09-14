import { BadRequestException } from '@nestjs/common';

/**
 * Resolusi & validasi "Maximum Free Chapter" (Fase 5, SEO) — satu sumber
 * kebenaran dipakai `BooksService` (validasi saat create/update) DAN
 * `PublicService` (hitung `isFree` per Chapter). Lihat
 * plan/bookpedia/overview.md §11 untuk desain lengkap & alasan tiap aturan.
 *
 * SENTINEL `0` = TANPA BATAS (semua Chapter gratis) — BUKAN "nol Chapter
 * gratis". Istilah ini sengaja dipertahankan sesuai keputusan produk, WAJIB
 * dijelaskan ulang di setiap tempat field ini muncul (tooltip UI, Swagger,
 * komentar kode) supaya tidak disalahartikan kebalikannya.
 */

/**
 * Nilai efektif batas Chapter gratis untuk satu Book, setelah
 * mempertimbangkan override-nya (kalau ada) terhadap kebijakan Platform.
 *
 * `Math.max(...)` di baris terakhir adalah jaring pengaman: kalau Platform
 * menaikkan batasnya SETELAH sebuah Book sudah ter-override dengan angka
 * yang jadi tidak valid lagi (lebih kecil dari Platform baru), nilai efektif
 * otomatis ikut naik mengikuti Platform — tidak perlu migrasi data
 * retroaktif ke Book-Book lama.
 */
export function resolveEffectiveMaxFreeChapters(
  platformMaxFreeChapters: number,
  bookMaxFreeChapters: number | null,
): number {
  if (platformMaxFreeChapters === 0) return 0;
  if (bookMaxFreeChapters === null) return platformMaxFreeChapters;
  if (bookMaxFreeChapters === 0) return 0;
  return Math.max(bookMaxFreeChapters, platformMaxFreeChapters);
}

/** Chapter dianggap gratis kalau berada di dalam batas efektif (atau batasnya "tanpa batas"). */
export function isChapterFree(
  platformMaxFreeChapters: number,
  bookMaxFreeChapters: number | null,
  chapterOrderIndex: number,
): boolean {
  const effective = resolveEffectiveMaxFreeChapters(platformMaxFreeChapters, bookMaxFreeChapters);
  return effective === 0 || chapterOrderIndex <= effective;
}

/**
 * Validasi input `maxFreeChapters` Book terhadap kebijakan Platform saat ini
 * (§11.2 overview.md). Dipanggil `BooksService` (bukan divalidasi di DTO —
 * butuh baca Platform saat ini, cross-entity). Throw `BadRequestException`
 * kalau melanggar aturan:
 * - Platform = 0 (sudah "semua gratis") -> Book tidak boleh override sama sekali.
 * - Platform = N (N > 0) -> Book harus 0 (override semua-gratis) atau > N,
 *   TIDAK BOLEH di rentang 1..N (itu lebih ketat dari jaminan Platform).
 */
export function assertValidBookMaxFreeChapters(
  platformMaxFreeChapters: number,
  bookMaxFreeChapters: number | null | undefined,
): void {
  if (bookMaxFreeChapters === null || bookMaxFreeChapters === undefined) {
    return;
  }
  if (platformMaxFreeChapters === 0) {
    throw new BadRequestException(
      'Platform ini sudah mengatur semua Chapter gratis (Maximum Free Chapter = 0) — Book tidak bisa override.',
    );
  }
  if (bookMaxFreeChapters !== 0 && bookMaxFreeChapters <= platformMaxFreeChapters) {
    throw new BadRequestException(
      `maxFreeChapters Book harus 0 (semua gratis) atau lebih besar dari kebijakan Platform saat ini (${platformMaxFreeChapters}).`,
    );
  }
}
