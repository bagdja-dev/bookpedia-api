import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { ReadingProgressService } from './reading-progress.service';
import { PutReadingProgressDto } from './dto/put-reading-progress.dto';
import { ReadingProgressResponseDto } from './dto/reading-progress-response.dto';
import { ReadingProgressListItemDto } from './dto/reading-progress-list-item.dto';
import { UpdateReadingProgressVisibilityDto } from './dto/update-reading-progress-visibility.dto';

/**
 * Fase 3 — reading progress. User login di sini adalah PEMBACA, BUKAN
 * pemilik Book/Library (beda scoping dari module `chapters`/`books`).
 * Validasi chapterId query Chapter langsung via repository
 * (ReadingProgressService), TIDAK lewat ChaptersService/BooksService yang
 * owner-scoped — lihat catatan di module `public`.
 */
@ApiTags('Reading Progress')
@Controller('reading-progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReadingProgressController {
  constructor(private readonly readingProgressService: ReadingProgressService) {}

  @Put()
  @ApiOperation({
    summary: 'Simpan/upsert posisi baca terakhir user login untuk 1 Book',
    description:
      'chapterId harus Chapter yang ADA, book_id-nya sama dengan bookId yang dikirim, DAN status published (404 kalau salah satu tidak terpenuhi — draft/chapter tidak valid tidak boleh disimpan sebagai progress). Upsert by (user_id, book_id): update last_chapter_id+updated_at kalau sudah ada baris, insert baru kalau belum.',
  })
  @ApiOkResponse({ type: ReadingProgressResponseDto, description: 'Progress terbaru setelah disimpan' })
  async upsert(
    @CurrentUser() user: AuthUser,
    @Body() dto: PutReadingProgressDto,
  ): Promise<ReadingProgressResponseDto> {
    return this.readingProgressService.upsert(user.userId, dto);
  }

  @Get(':bookId')
  @ApiOperation({
    summary: 'Progress baca user login untuk 1 Book (untuk render tombol "Lanjutkan Baca")',
    description: '404 kalau user login belum pernah punya progress untuk Book ini.',
  })
  @ApiOkResponse({ type: ReadingProgressResponseDto, description: 'Progress baca user login untuk Book ini' })
  async findOneForBook(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
  ): Promise<ReadingProgressResponseDto> {
    return this.readingProgressService.findOneForBook(user.userId, bookId);
  }

  @Patch(':bookId/visibility')
  @ApiOperation({ summary: 'Atur apakah Book tampil pada Reading List profil publik user' })
  @ApiOkResponse({ type: ReadingProgressResponseDto, description: 'Visibilitas Reading List diperbarui' })
  async updateVisibility(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingProgressVisibilityDto,
  ): Promise<ReadingProgressResponseDto> {
    return this.readingProgressService.updateVisibility(user.userId, bookId, dto.isPublic);
  }

  @Get()
  @ApiOperation({
    summary: 'Semua progress baca user login, lintas Book',
    description: 'Urut updated_at DESC, maksimal 20 Book terakhir dibaca.',
  })
  @ApiOkResponse({
    type: ReadingProgressListItemDto,
    isArray: true,
    description: 'Daftar progress baca user login, terbaru dulu',
  })
  async findAllForUser(@CurrentUser() user: AuthUser): Promise<ReadingProgressListItemDto[]> {
    return this.readingProgressService.findAllForUser(user.userId);
  }
}
