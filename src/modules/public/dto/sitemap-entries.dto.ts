import { ApiProperty } from '@nestjs/swagger';

/** SEO Fase 2 — satu entry sitemap (Book atau Library). */
export class SitemapEntryDto {
  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Susulan 17 Sep 2026 (revisi keputusan seo-plan.md §6.2) — satu entry
 * Chapter individual. `bookSlug`+`orderIndex` (BUKAN `chapter.id`) supaya
 * konsisten dengan URL publik `/book/{bookSlug}/chapter/{orderIndex}`.
 */
export class ChapterSitemapEntryDto {
  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  bookSlug: string;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Dipakai `src/app/sitemap.ts` (bookpedia-app) — TANPA pagination (skala
 * data saat ini kecil, lihat plan/bookpedia/seo-plan.md §3.4; revisit kalau
 * Book sudah ribuan, pakai `generateSitemaps()`). Chapter individual
 * SEKARANG DISERTAKAN (revisi 17 Sep 2026 — keputusan lama seo-plan.md §6.2
 * "cukup Book-level" dibuka ulang, lihat plan.md untuk alasannya).
 */
export class SitemapEntriesDto {
  @ApiProperty({ type: SitemapEntryDto, isArray: true })
  books: SitemapEntryDto[];

  @ApiProperty({ type: SitemapEntryDto, isArray: true })
  libraries: SitemapEntryDto[];

  @ApiProperty({ type: ChapterSitemapEntryDto, isArray: true })
  chapters: ChapterSitemapEntryDto[];
}
