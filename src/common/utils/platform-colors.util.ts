import { BadRequestException } from '@nestjs/common';

/** Palet umum — wajib dipakai sebagai fallback semua warna spesifik. */
export const BASE_COLOR_KEYS = [
  'bg', 'surface', 'foreground', 'muted', 'border', 'terracotta', 'terracottaForeground', 'mustard', 'olive',
] as const;

/**
 * Warna spesifik per bagian — opsional; kosong = mengikuti palet umum (reader memakai
 * `var(--spesifik, var(--umum))`), jadi Platform lama tidak berubah tampilannya.
 */
export const SPECIFIC_COLOR_KEYS = [
  // Header
  'headerBg', 'headerText', 'headerBorder',
  // Kartu buku
  'cardBg', 'cardBorder', 'cardTitle', 'cardText', 'cardChipBg',
  // Footer
  'footerBg', 'footerText',
  // Tombol utama (aksen/link tetap `terracotta`)
  'buttonBg', 'buttonText',
  // Status & rating
  'statusOngoing', 'statusCompleted', 'statusDraft', 'ratingStar',
  // Area baca Chapter
  'readingBg', 'readingText',
] as const;

const ALLOWED_KEYS = new Set<string>([...BASE_COLOR_KEYS, ...SPECIFIC_COLOR_KEYS]);
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Validasi `colors` sebelum disimpan: hanya key yang dikenal dan nilai hex (#rgb, #rrggbb,
 * #rrggbbaa). Nilai ini disisipkan ke `<style>` reader app, jadi format bebas = celah CSS
 * injection. Warna spesifik yang dikosongkan dibuang (= ikut palet umum).
 */
export function sanitizePlatformColors(colors: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  const invalid: string[] = [];
  for (const [key, raw] of Object.entries(colors ?? {})) {
    if (!ALLOWED_KEYS.has(key)) {
      invalid.push(`${key} (tidak dikenal)`);
      continue;
    }
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value && (SPECIFIC_COLOR_KEYS as readonly string[]).includes(key)) continue;
    if (!HEX_COLOR.test(value)) {
      invalid.push(`${key} (harus hex, mis. #1a2b3c)`);
      continue;
    }
    result[key] = value.toLowerCase();
  }
  if (invalid.length) {
    throw new BadRequestException(`Warna tidak valid: ${invalid.join(', ')}`);
  }
  return result;
}
