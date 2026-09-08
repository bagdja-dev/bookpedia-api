import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicService } from './public.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { LibraryProfileDto } from './dto/library-profile.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { ChapterDetailDto } from './dto/chapter-detail.dto';

/**
 * Endpoint publik Fase 2 — TANPA autentikasi sama sekali (tidak ada
 * @UseGuards di controller ini, genuinely public). Prefix `/public/...`
 * supaya tidak ambigu/bentrok dengan `/libraries`, `/books` yang tetap
 * butuh auth untuk kebutuhan penulis (Studio). Dipakai reader app
 * (novelo-app) untuk katalog pusat & baca Chapter tanpa login.
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Katalog pusat Book lintas semua Library',
    description:
      'HANYA Book dengan minimal 1 Chapter berstatus published yang muncul. search filter judul (ILIKE), genre filter by slug genre (exact match, dari GET /public/genres — bukan free text lagi). page default 1, limit default 20 (max 50).',
  })
  @ApiOkResponse({ type: CatalogResponseDto, description: 'Daftar Book publik (paginated)' })
  async getCatalog(@Query() query: CatalogQueryDto): Promise<CatalogResponseDto> {
    return this.publicService.getCatalog(query);
  }

  @Get('libraries/:slug')
  @ApiOperation({
    summary: 'Profil publik Library by slug',
    description:
      '404 kalau slug tidak ditemukan. `books` HANYA Book dengan minimal 1 Chapter published (aturan sama seperti /public/catalog).',
  })
  @ApiOkResponse({ type: LibraryProfileDto, description: 'Profil Library + daftar Book publiknya' })
  async getLibrary(@Param('slug') slug: string): Promise<LibraryProfileDto> {
    return this.publicService.getLibraryBySlug(slug);
  }

  @Get('books/:slug')
  @ApiOperation({
    summary: 'Detail publik Book by slug',
    description:
      '404 kalau slug tidak ditemukan ATAU Book tidak punya Chapter published sama sekali (tidak "discoverable" publik). `chapters` HANYA yang published, urut orderIndex ASC.',
  })
  @ApiOkResponse({ type: BookDetailDto, description: 'Detail Book + daftar Chapter published' })
  async getBook(@Param('slug') slug: string): Promise<BookDetailDto> {
    return this.publicService.getBookBySlug(slug);
  }

  @Get('books/:slug/chapters/:orderIndex')
  @ApiOperation({
    summary: 'Konten 1 Chapter publik by order_index (bukan chapter id)',
    description:
      'orderIndex adalah angka order_index (bukan UUID) supaya URL publik /book/{slug}/chapter/{n} enak dibaca. 404 kalau Book tidak ditemukan ATAU tidak ada Chapter di orderIndex tsb ATAU statusnya bukan published (draft tidak boleh bocor). prevOrderIndex/nextOrderIndex melompati Chapter draft di antaranya.',
  })
  @ApiOkResponse({ type: ChapterDetailDto, description: 'Konten Chapter + navigasi next/prev' })
  async getChapter(
    @Param('slug') slug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
  ): Promise<ChapterDetailDto> {
    return this.publicService.getChapterByOrderIndex(slug, orderIndex);
  }
}
