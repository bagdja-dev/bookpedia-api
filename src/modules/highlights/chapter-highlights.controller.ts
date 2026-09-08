import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { HighlightResponseDto } from './dto/highlight-response.dto';

/**
 * Fase 3 — highlight scoped ke 1 Chapter (`chapterId` di URL). User login di
 * sini adalah PEMBACA, bukan pemilik Book/Library — chapterId divalidasi
 * langsung via repository (HighlightsService: harus ADA & published), TIDAK
 * lewat ChaptersService yang owner-scoped.
 */
@ApiTags('Highlights')
@Controller('chapters/:chapterId/highlights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChapterHighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Post()
  @ApiOperation({
    summary: 'Buat highlight baru di 1 Chapter',
    description:
      'chapterId harus Chapter yang ADA dan status published (404 kalau tidak). content_version DIISI SERVER-SIDE dari content_version Chapter saat ini — client TIDAK mengirim field ini.',
  })
  @ApiCreatedResponse({ type: HighlightResponseDto, description: 'Highlight berhasil dibuat' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateHighlightDto,
  ): Promise<HighlightResponseDto> {
    return this.highlightsService.create(user.userId, chapterId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Highlight milik user login untuk 1 Chapter (dipakai render overlay di halaman baca)',
    description:
      'HANYA highlight yang content_version snapshot-nya SAMA dengan content_version Chapter saat ini (anti-drift) — highlight basi TIDAK ikut di sini, lihat GET /highlights untuk semuanya (termasuk yang basi).',
  })
  @ApiOkResponse({
    type: HighlightResponseDto,
    isArray: true,
    description: 'Daftar highlight aktif (tidak basi) milik user login di Chapter ini',
  })
  async findAllForChapter(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
  ): Promise<HighlightResponseDto[]> {
    return this.highlightsService.findAllForChapter(user.userId, chapterId);
  }
}
