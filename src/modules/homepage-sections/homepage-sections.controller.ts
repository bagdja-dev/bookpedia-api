import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard } from '../../common/auth';
import { HomepageSectionBookDto } from './dto/homepage-section-book.dto';
import { ReplaceHomepageSectionBooksDto } from './dto/replace-homepage-section-books.dto';
import { HomepageSectionsService } from './homepage-sections.service';

/**
 * Daftar Book section homepage mode "manual". Akses sama dengan `PATCH /platforms/:id`
 * (Owner, atau Staff aktif Platform itu — `PlatformAccessGuard` via `:platformId`).
 */
@ApiTags('Homepage Sections')
@Controller('platforms/:platformId/homepage-sections/:sectionId/books')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class HomepageSectionsController {
  constructor(private readonly homepageSections: HomepageSectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Book section homepage manual (urut posisi tampil)' })
  @ApiOkResponse({
    type: HomepageSectionBookDto,
    isArray: true,
    description: 'Book terpilih berurutan, termasuk yang sedang tidak tampil (`isVisible: false`).',
  })
  async list(
    @Param('platformId', ParseUUIDPipe) platformId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ): Promise<HomepageSectionBookDto[]> {
    return this.homepageSections.listBooks(platformId, sectionId);
  }

  @Put()
  @ApiOperation({
    summary: 'Ganti seluruh daftar Book section homepage manual (replace-all)',
    description: 'Urutan array = urutan tampil. Semua Book harus berada di Platform ini; Book yang baru ditambahkan harus published (minimal 1 Chapter published), Book yang sudah ada di list boleh tetap disimpan walau di-unpublish. Maks 50. Section harus sudah tersimpan di pengaturan homepage.',
  })
  @ApiOkResponse({ type: HomepageSectionBookDto, isArray: true, description: 'Daftar Book setelah disimpan, berurutan.' })
  async replace(
    @Param('platformId', ParseUUIDPipe) platformId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: ReplaceHomepageSectionBooksDto,
  ): Promise<HomepageSectionBookDto[]> {
    return this.homepageSections.replaceBooks(platformId, sectionId, dto.bookIds);
  }
}
