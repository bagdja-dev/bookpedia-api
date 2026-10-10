/** Font kurasi teks bacaan — key ini juga dipakai reader app (next/font) dan admin. */
export const READING_FONT_FAMILIES = [
  'source-serif-4',
  'merriweather',
  'lora',
  'literata',
  'noto-serif',
  'inter',
  'nunito',
  'noto-sans',
] as const;

export type ReadingFontFamily = (typeof READING_FONT_FAMILIES)[number];

export interface ReadingTypography {
  fontFamily: ReadingFontFamily;
  /** px */
  fontSize: number;
  /** kelipatan ukuran font */
  lineHeight: number;
  /** em — jarak bawah tiap paragraf */
  paragraphSpacing: number;
  /** em — indentasi baris pertama paragraf (0 = tanpa indentasi) */
  firstLineIndent: number;
}

export const READING_TYPOGRAPHY_LIMITS = {
  fontSize: { min: 14, max: 24 },
  lineHeight: { min: 1.3, max: 2.4 },
  paragraphSpacing: { min: 0, max: 2.5 },
  firstLineIndent: { min: 0, max: 3 },
} as const;

/** Sama dengan tampilan reader sebelum fitur ini (Source Serif 4, 17px, 1.9, 1.25em). */
export const DEFAULT_READING_TYPOGRAPHY: ReadingTypography = {
  fontFamily: 'source-serif-4',
  fontSize: 17,
  lineHeight: 1.9,
  paragraphSpacing: 1.25,
  firstLineIndent: 0,
};

function clampNumber(value: unknown, fallback: number, limits: { min: number; max: number }): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(limits.max, Math.max(limits.min, numeric));
}

/** Nilai tersimpan (bisa NULL / sebagian / data lama) → tipografi lengkap yang aman dipakai. */
export function resolveReadingTypography(raw: Partial<ReadingTypography> | null | undefined): ReadingTypography {
  const value = raw ?? {};
  return {
    fontFamily: READING_FONT_FAMILIES.includes(value.fontFamily as ReadingFontFamily)
      ? (value.fontFamily as ReadingFontFamily)
      : DEFAULT_READING_TYPOGRAPHY.fontFamily,
    fontSize: Math.round(clampNumber(value.fontSize, DEFAULT_READING_TYPOGRAPHY.fontSize, READING_TYPOGRAPHY_LIMITS.fontSize)),
    lineHeight: clampNumber(value.lineHeight, DEFAULT_READING_TYPOGRAPHY.lineHeight, READING_TYPOGRAPHY_LIMITS.lineHeight),
    paragraphSpacing: clampNumber(value.paragraphSpacing, DEFAULT_READING_TYPOGRAPHY.paragraphSpacing, READING_TYPOGRAPHY_LIMITS.paragraphSpacing),
    firstLineIndent: clampNumber(value.firstLineIndent, DEFAULT_READING_TYPOGRAPHY.firstLineIndent, READING_TYPOGRAPHY_LIMITS.firstLineIndent),
  };
}
