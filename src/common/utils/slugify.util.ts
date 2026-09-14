/**
 * Slugify sederhana (lowercase-kebab-case) — dipakai `TagsService` untuk
 * menormalisasi nama Tag bebas-teks jadi slug (find-or-create), berbeda
 * dari Genre/Category yang slug-nya selalu dikirim eksplisit oleh admin
 * (sudah tervalidasi `@Matches` di DTO, tidak butuh slugify server-side).
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // buang diakritik (é -> e)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
