import { ApiProperty } from '@nestjs/swagger';

/** SEO Fase 2 — satu entry sitemap (Book atau Library). */
export class SitemapEntryDto {
  @ApiProperty({ example: 'kisah-di-ujung-senja' })
  slug: string;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Dipakai `src/app/sitemap.ts` (bookpedia-app) — TANPA pagination (skala
 * data saat ini kecil, lihat plan/bookpedia/seo-plan.md §3.4; revisit kalau
 * Book sudah ribuan). Chapter individual SENGAJA tidak disertakan
 * (keputusan 16 Sep 2026, seo-plan.md §6.2).
 */
export class SitemapEntriesDto {
  @ApiProperty({ type: SitemapEntryDto, isArray: true })
  books: SitemapEntryDto[];

  @ApiProperty({ type: SitemapEntryDto, isArray: true })
  libraries: SitemapEntryDto[];
}
