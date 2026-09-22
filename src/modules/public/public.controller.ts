import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicService } from './public.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { CatalogHomeResponseDto } from './dto/catalog-home-response.dto';
import { LibraryProfileDto } from './dto/library-profile.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { ChapterDetailDto } from './dto/chapter-detail.dto';
import { PlatformResolveResponseDto } from './dto/platform-resolve-response.dto';
import { PlatformPublicProfileDto } from './dto/platform-public-profile.dto';
import { SitemapEntriesDto } from './dto/sitemap-entries.dto';
import { UserProfileStatsDto } from './dto/user-profile-stats.dto';

/**
 * Endpoint publik — TANPA autentikasi sama sekali (tidak ada @UseGuards di
 * controller ini, genuinely public). Prefix `/public/...` supaya tidak
 * ambigu/bentrok dengan `/libraries`, `/books` yang tetap butuh auth untuk
 * kebutuhan penulis (Studio). Dipakai reader app (bookpedia-app) untuk katalog
 * pusat & baca Chapter tanpa login.
 *
 * Fase 4 (§4.1, 10 Sep 2026): semua route Book/Library/Chapter di bawah
 * pindah ke bawah `platforms/:platformSlug/...` (resolusi Platform via path
 * param eksplisit, BUKAN Host header — lihat plan/bookpedia/execution-plan.md
 * §4.1). `platforms/resolve` (custom domain) dan `platforms/:platformSlug`
 * (profil publik, pengganti `GET /public/config` lama) HARUS didaftarkan
 * SEBELUM `platforms/:platformSlug/...` supaya "resolve" tidak ketelan jadi
 * value `:platformSlug`.
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('realtime/ws-token')
  @ApiOperation({ summary: 'Tukar client credential menjadi token WebSocket Event Hub' })
  async getRealtimeWsToken(): Promise<{ access_token: string; expires_in: number; channels: string[] }> {
    return this.publicService.getRealtimeWsToken();
  }

  @Get('platforms/resolve')
  @ApiOperation({
    summary: 'Resolusi Platform dari custom domain',
    description: 'Dipanggil middleware bookpedia-app untuk custom domain (BUKAN subdomain wildcard {slug}.bookpedia.bagdja.com — itu di-parse langsung dari hostname di frontend). 404 kalau domain tidak ditemukan/belum lolos verifikasi.',
  })
  @ApiOkResponse({ type: PlatformResolveResponseDto })
  async resolvePlatform(@Query('host') host: string): Promise<PlatformResolveResponseDto> {
    return this.publicService.resolveByHost(host);
  }

  @Get('platforms/:platformSlug')
  @ApiOperation({
    summary: 'Profil publik Platform by slug',
    description: 'Pengganti langsung GET /public/config lama (Fase 4) — branding (nama/logo/favicon/colors) + lockStudio + rendererKey, di-scope per-Platform.',
  })
  @ApiOkResponse({ type: PlatformPublicProfileDto })
  async getPlatformProfile(@Param('platformSlug') platformSlug: string): Promise<PlatformPublicProfileDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.toPublicProfileDto(platform);
  }

  @Get('platforms/:platformSlug/catalog')
  @ApiOperation({
    summary: 'Katalog pusat Book lintas semua Library milik satu Platform',
    description:
      'HANYA Book dengan minimal 1 Chapter berstatus published yang muncul. search filter judul (ILIKE), genre filter by slug genre (exact match, dari GET /public/platforms/:platformSlug/genres — bukan free text lagi), category filter by slug Category (Book.category_id, dari GET /public/platforms/:platformSlug/categories — independen dari genre). page default 1, limit default 20 (max 50).',
  })
  @ApiOkResponse({ type: CatalogResponseDto, description: 'Daftar Book publik (paginated)' })
  async getCatalog(
    @Param('platformSlug') platformSlug: string,
    @Query() query: CatalogQueryDto,
  ): Promise<CatalogResponseDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getCatalog(platform.id, query);
  }

  @Get('platforms/:platformSlug/home')
  @ApiOperation({ summary: 'Homepage katalog berbasis section Platform' })
  @ApiOkResponse({ type: CatalogHomeResponseDto })
  async getHome(@Param('platformSlug') platformSlug: string): Promise<CatalogHomeResponseDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getHomepage(platform);
  }

  @Get('platforms/:platformSlug/sitemap-entries')
  @ApiOperation({
    summary: 'Daftar Book+Library publik untuk sitemap.xml (SEO Fase 2)',
    description: 'TANPA pagination. Chapter individual sengaja tidak disertakan (lihat plan/bookpedia/seo-plan.md §6.2).',
  })
  @ApiOkResponse({ type: SitemapEntriesDto })
  async getSitemapEntries(@Param('platformSlug') platformSlug: string): Promise<SitemapEntriesDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getSitemapEntries(platform.id);
  }

  @Get('platforms/:platformSlug/libraries/:librarySlug')
  @ApiOperation({
    summary: 'Profil publik Library by slug (di-scope ke satu Platform)',
    description:
      '404 kalau slug tidak ditemukan di Platform ini. `books` HANYA Book dengan minimal 1 Chapter published (aturan sama seperti /public/platforms/:platformSlug/catalog).',
  })
  @ApiOkResponse({ type: LibraryProfileDto, description: 'Profil Library + daftar Book publiknya' })
  async getLibrary(
    @Param('platformSlug') platformSlug: string,
    @Param('librarySlug') librarySlug: string,
  ): Promise<LibraryProfileDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getLibraryBySlug(platform.id, librarySlug);
  }

  @Get('platforms/:platformSlug/books/:bookSlug')
  @ApiOperation({
    summary: 'Detail publik Book by slug (di-scope ke satu Platform)',
    description:
      '404 kalau slug tidak ditemukan di Platform ini ATAU Book tidak punya Chapter published sama sekali (tidak "discoverable" publik). `chapters` HANYA yang published, urut orderIndex ASC.',
  })
  @ApiOkResponse({ type: BookDetailDto, description: 'Detail Book + daftar Chapter published' })
  async getBook(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
  ): Promise<BookDetailDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getBookBySlug(platform, bookSlug);
  }

  @Get('platforms/:platformSlug/books/:bookSlug/chapters/:orderIndex')
  @ApiOperation({
    summary: 'Konten 1 Chapter publik by order_index (bukan chapter id), di-scope ke satu Platform',
    description:
      'orderIndex adalah angka order_index (bukan UUID) supaya URL publik /book/{slug}/chapter/{n} enak dibaca. 404 kalau Book tidak ditemukan di Platform ini ATAU tidak ada Chapter di orderIndex tsb ATAU statusnya bukan published (draft tidak boleh bocor). prevOrderIndex/nextOrderIndex melompati Chapter draft di antaranya.',
  })
  @ApiOkResponse({ type: ChapterDetailDto, description: 'Konten Chapter + navigasi next/prev' })
  async getChapter(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
  ): Promise<ChapterDetailDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getChapterByOrderIndex(platform, bookSlug, orderIndex);
  }

  @Get('platforms/:platformSlug/users/:userId')
  @ApiOperation({
    summary: 'Statistik publik 1 user (halaman Profile User) — Karya + Reading List, TANPA Followers (tidak ada konsepnya)',
    description:
      'Murni display, tidak ada endpoint tulis. Nama/avatar user TIDAK dikembalikan di sini (bookpedia-api sengaja tanpa tabel users lokal) — frontend membawanya dari konteks klik. userId tidak divalidasi ke bagdja-auth; kalau tidak ditemukan/belum pernah berinteraksi, dikembalikan worksCount:0, librarySlug:null, readingList:[] (BUKAN 404).',
  })
  @ApiOkResponse({ type: UserProfileStatsDto })
  async getUserProfileStats(
    @Param('platformSlug') platformSlug: string,
    @Param('userId') userId: string,
  ): Promise<UserProfileStatsDto> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    return this.publicService.getUserProfileStats(platform.id, userId);
  }

  @Post('platforms/:platformSlug/books/:bookSlug/chapters/:orderIndex/view')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Catat 1x "buka" Chapter ini (statistik baca, Fase 7)',
    description:
      'TANPA autentikasi — dihitung untuk SEMUA pembaca (termasuk anonim). Dihitung MENTAH, termasuk buka ulang oleh pembaca yang sama. Menaikkan chapters.view_count DAN books.view_count sekaligus (atomik). Dipanggil komponen client ChapterViewTracker, fire-and-forget.',
  })
  @ApiOkResponse({ description: 'View tercatat, tidak ada body response' })
  async recordChapterView(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
  ): Promise<void> {
    const platform = await this.publicService.resolvePlatformBySlugOrThrow(platformSlug);
    await this.publicService.incrementChapterView(platform, bookSlug, orderIndex);
  }
}
