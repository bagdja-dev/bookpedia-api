import { randomUUID } from 'node:crypto';

import type { CatalogSectionConfig } from '../../entities/platform.entity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const SECTION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;
const MAX_PREVIOUS_SLUGS = 20;

/** "Novel Terjemahan China!" → "novel-terjemahan-china". */
export function slugifySectionTitle(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}

/**
 * Lengkapi `slug` tiap section (halaman /list/{slug}): pakai slug isian bila valid, kalau
 * kosong turunkan dari judul (lalu `key`), dan pastikan unik dalam satu Platform dengan
 * akhiran -2, -3, … Deterministik untuk urutan section yang sama, jadi aman dipakai juga
 * saat membaca section lama yang belum punya slug.
 */
export function withSectionSlugs(sections: CatalogSectionConfig[]): CatalogSectionConfig[] {
  const taken = new Set<string>();
  return sections.map((section) => {
    const requested = section.slug && SECTION_SLUG_PATTERN.test(section.slug) ? section.slug : '';
    const base = requested || slugifySectionTitle(section.title ?? '') || slugifySectionTitle(section.key ?? '') || 'list';
    let slug = base;
    for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base.slice(0, MAX_SLUG_LENGTH - 4)}-${suffix}`;
    taken.add(slug);
    return { ...section, slug };
  });
}

/**
 * Normalisasi section saat disimpan: `id` UUID permanen (acuan list manual & redirect),
 * `slug` unik, dan `previousSlugs` — slug lama section yang sama (dicocokkan lewat `id`
 * dengan versi sebelumnya) supaya URL /list/{slug-lama} tetap diarahkan ke slug baru.
 * `previousSlugs` dikelola server; isian dari client diabaikan.
 */
export function normalizeHomepageSections(
  sections: CatalogSectionConfig[],
  previous: CatalogSectionConfig[] = [],
): CatalogSectionConfig[] {
  const seenIds = new Set<string>();
  const withIds = sections.map((section) => {
    let id = section.id && UUID_PATTERN.test(section.id) ? section.id.toLowerCase() : randomUUID();
    if (seenIds.has(id)) id = randomUUID();
    seenIds.add(id);
    return { ...section, id };
  });

  const slugged = withSectionSlugs(withIds);
  const currentSlugs = new Set(slugged.map((section) => section.slug!));
  const previousById = new Map(withSectionSlugs(previous).filter((item) => item.id).map((item) => [item.id!, item]));

  return slugged.map((section) => {
    const before = previousById.get(section.id!);
    const history = [...(before?.previousSlugs ?? []), ...(before?.slug && before.slug !== section.slug ? [before.slug] : [])];
    const previousSlugs = [...new Set(history)].filter((slug) => !currentSlugs.has(slug)).slice(-MAX_PREVIOUS_SLUGS);
    return { ...section, previousSlugs };
  });
}
