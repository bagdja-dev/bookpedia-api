import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';

@ApiTags('Chapters')
@Controller('books/:bookId/chapters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({
    summary: 'Tambah Chapter baru ke Book',
    description:
      'bookId di URL harus Book milik Library user login (404 kalau bukan). order_index di-auto-assign MAX(order_index)+1 (mulai dari 1 kalau belum ada Chapter). status selalu mulai "draft", content_version mulai 1.',
  })
  @ApiOkResponse({ type: ChapterResponseDto, description: 'Chapter berhasil dibuat' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: CreateChapterDto,
  ): Promise<ChapterResponseDto> {
    const chapter = await this.chaptersService.create(user.userId, bookId, dto);
    return this.chaptersService.toResponseDto(chapter);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar Chapter milik Book, urut order_index ASC' })
  @ApiOkResponse({ type: ChapterResponseDto, isArray: true, description: 'Daftar Chapter urut order_index ASC' })
  async findAll(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string): Promise<ChapterResponseDto[]> {
    const chapters = await this.chaptersService.findAllForBook(user.userId, bookId);
    return chapters.map((chapter) => this.chaptersService.toResponseDto(chapter));
  }

  @Patch('reorder')
  @ApiOperation({
    summary: 'Ubah urutan (order_index) banyak Chapter sekaligus',
    description:
      'Diupdate dalam satu DB transaction (tidak ada state order_index duplikat/hilang kalau gagal di tengah). Semua id di items harus Chapter milik bookId ini (400 kalau ada yang tidak cocok).',
  })
  @ApiOkResponse({ type: ChapterResponseDto, isArray: true, description: 'Daftar Chapter terbaru urut order_index ASC' })
  async reorder(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: ReorderChaptersDto,
  ): Promise<ChapterResponseDto[]> {
    const chapters = await this.chaptersService.reorder(user.userId, bookId, dto);
    return chapters.map((chapter) => this.chaptersService.toResponseDto(chapter));
  }

  @Get(':chapterId')
  @ApiOperation({
    summary: 'Detail 1 Chapter',
    description: '404 kalau Chapter bukan milik Book ini ATAU Book bukan milik Library user login.',
  })
  @ApiOkResponse({ type: ChapterResponseDto, description: 'Detail Chapter' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<ChapterResponseDto> {
    const chapter = await this.chaptersService.findOneForBook(user.userId, bookId, chapterId);
    return this.chaptersService.toResponseDto(chapter);
  }

  @Patch(':chapterId')
  @ApiOperation({
    summary: 'Update Chapter (judul/konten/status)',
    description:
      'Semua field body opsional. konten berubah (beda dari tersimpan) -> content_version naik +1. status draft->published -> published_at diisi now(); published->draft -> published_at di-null-kan lagi.',
  })
  @ApiOkResponse({ type: ChapterResponseDto, description: 'Chapter terbaru setelah diupdate' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpdateChapterDto,
  ): Promise<ChapterResponseDto> {
    const chapter = await this.chaptersService.update(user.userId, bookId, chapterId, dto);
    return this.chaptersService.toResponseDto(chapter);
  }

  @Delete(':chapterId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Hapus Chapter',
    description:
      '404 kalau Chapter bukan milik Book ini ATAU Book bukan milik Library user login. reading_progress/chapter_highlights yang menunjuk ke Chapter ini ikut terhapus (ON DELETE CASCADE).',
  })
  @ApiNoContentResponse({ description: 'Chapter berhasil dihapus' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Param('chapterId') chapterId: string,
  ): Promise<void> {
    await this.chaptersService.remove(user.userId, bookId, chapterId);
  }
}
