import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { HighlightsService } from './highlights.service';
import { HighlightListItemDto } from './dto/highlight-list-item.dto';

/**
 * Fase 3 — highlight lintas Book/Chapter milik user login ("Highlight
 * Saya" & hapus highlight). Endpoint per-Chapter (create/list aktif) ada di
 * ChapterHighlightsController (`/chapters/:chapterId/highlights`).
 */
@ApiTags('Highlights')
@Controller('highlights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get()
  @ApiOperation({
    summary: 'Semua highlight milik user login, lintas Book/Chapter',
    description:
      'Termasuk highlight yang sudah basi (content_version snapshot beda dari content_version Chapter saat ini) — ditandai lewat field `isStale`, tidak difilter seperti GET /chapters/:chapterId/highlights. Dipakai halaman "Highlight Saya".',
  })
  @ApiOkResponse({ type: HighlightListItemDto, isArray: true, description: 'Daftar semua highlight user login, terbaru dulu' })
  async findAllForUser(@CurrentUser() user: AuthUser): Promise<HighlightListItemDto[]> {
    return this.highlightsService.findAllForUser(user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus 1 highlight milik user login', description: '404 kalau highlight tidak ada ATAU bukan milik user login.' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.highlightsService.remove(user.userId, id);
  }
}
