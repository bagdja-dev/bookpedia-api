import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type AuthUser } from '../../common/auth';
import { PlatformsService } from '../platforms/platforms.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { CommentsService } from './comments.service';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly platformsService: PlatformsService,
  ) {}

  @Get('public/platforms/:platformSlug/books/:bookSlug/chapters/:orderIndex/comments')
  @ApiOperation({ summary: 'Daftar komentar publik untuk Chapter' })
  @ApiOkResponse({ description: 'Komentar top-level beserta totalnya' })
  async listPublic(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
    @Query() query: ListCommentsQueryDto,
  ) {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) throw new NotFoundException('Platform not found or inactive');
    return this.commentsService.listForPublicChapter(platform.id, bookSlug, orderIndex, query.limit ?? 20, query.offset ?? 0);
  }

  @Get('public/platforms/:platformSlug/books/:bookSlug/chapters/:orderIndex/comments/:messageId/replies')
  @ApiOperation({ summary: 'Daftar replies publik untuk thread Chapter' })
  @ApiOkResponse({ description: 'Thread komentar flat' })
  async repliesPublic(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
    @Param('messageId') messageId: string,
  ) {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) throw new NotFoundException('Platform not found or inactive');
    return this.commentsService.listRepliesForPublicChapter(platform.id, bookSlug, orderIndex, messageId);
  }

  @Get('public/platforms/:platformSlug/books/:bookSlug/chapters/:orderIndex/comments/:messageId')
  @ApiOperation({ summary: 'Ambil satu komentar publik by id (untuk append realtime, hindari refetch daftar penuh)' })
  @ApiOkResponse({ description: 'Satu komentar' })
  async getPublic(
    @Param('platformSlug') platformSlug: string,
    @Param('bookSlug') bookSlug: string,
    @Param('orderIndex', ParseIntPipe) orderIndex: number,
    @Param('messageId') messageId: string,
  ) {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) throw new NotFoundException('Platform not found or inactive');
    return this.commentsService.getMessageForPublicChapter(platform.id, bookSlug, orderIndex, messageId);
  }

  @Get('chapters/:chapterId/comments')
  @ApiOperation({ summary: 'Daftar komentar top-level Chapter publik' })
  @ApiOkResponse({ description: 'Komentar top-level beserta totalnya' })
  async list(
    @Param('chapterId') chapterId: string,
    @Query() query: ListCommentsQueryDto,
  ) {
    return this.commentsService.listForChapter(chapterId, query.limit ?? 20, query.offset ?? 0);
  }

  @Get('chapters/:chapterId/comments/:messageId/replies')
  @ApiOperation({ summary: 'Daftar seluruh replies dalam satu thread komentar' })
  @ApiOkResponse({ description: 'Thread komentar flat' })
  async replies(@Param('chapterId') chapterId: string, @Param('messageId') messageId: string) {
    return this.commentsService.listReplies(chapterId, messageId);
  }

  @Post('chapters/:chapterId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat komentar atau reply' })
  @ApiOkResponse({ description: 'Komentar berhasil dibuat' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateCommentDto,
  ) {
    // Snapshot username/email SAAT comment dibuat — bukan live-lookup ke
    // bagdja-auth (endpoint publik baca komentar sengaja tanpa auth, jadi
    // tidak ada JWT untuk resolve nama saat render). Lihat konvensi
    // "Snapshot Identitas Pengirim" di plan/architecture/overview.md.
    const senderDisplayName = user.username ?? user.email ?? null;
    return this.commentsService.create(chapterId, user.userId, senderDisplayName, dto);
  }

  @Delete('chapters/:chapterId/comments/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus komentar milik user login' })
  @ApiNoContentResponse({ description: 'Komentar berhasil dihapus secara soft delete' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
    @Param('messageId') messageId: string,
  ): Promise<void> {
    await this.commentsService.remove(chapterId, messageId, user.userId);
  }
}
