import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { LikesService } from './likes.service';
import { ToggleLikeResponseDto } from './dto/toggle-like-response.dto';

/**
 * Fase 8 — Like binary per Chapter, user login di sini adalah PEMBACA (pola
 * sama `RatingsController`/`ReadingProgressController`). Beda dari
 * `chapters/:orderIndex/view` (statistik baca) yang TIDAK butuh login —
 * Like WAJIB login (dipakai untuk cegah spam & identitas "siapa nge-like").
 */
@ApiTags('Likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('chapter/:chapterId')
  @ApiOperation({ summary: 'Status like user login untuk 1 Chapter + total likeCount saat ini', description: 'Dipanggil saat halaman baca Chapter dimuat, untuk render state awal tombol Like.' })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async findStatus(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
  ): Promise<ToggleLikeResponseDto> {
    return this.likesService.findStatus(user.userId, chapterId);
  }

  @Post('chapter/:chapterId/toggle')
  @ApiOperation({
    summary: 'Toggle like/unlike user login untuk 1 Chapter',
    description: '400 kalau enableLike false di Platform pemilik Chapter. Belum like -> like (insert + increment). Sudah like -> unlike (delete + decrement). Atomik terhadap chapters.likeCount DAN books.likeCount (agregat).',
  })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async toggle(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
  ): Promise<ToggleLikeResponseDto> {
    return this.likesService.toggle(user.userId, chapterId);
  }
}
