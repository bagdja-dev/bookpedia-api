import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { RatingsService } from './ratings.service';
import { PutBookRatingDto } from './dto/put-book-rating.dto';
import { PutChapterRatingDto } from './dto/put-chapter-rating.dto';
import { BookRatingResponseDto } from './dto/book-rating-response.dto';
import { ChapterRatingResponseDto } from './dto/chapter-rating-response.dto';

/**
 * Fase 7 — rating 1-5 bintang, user login di sini adalah PEMBACA (pola sama
 * `ReadingProgressController`, bukan owner-scoped). Endpoint Book dan Chapter
 * SENGAJA dipisah (bukan satu endpoint generik) karena tiap endpoint
 * memvalidasi `platform.ratingMode`-nya sendiri di RatingsService — 400 kalau
 * submit tidak cocok mode Platform saat ini.
 */
@ApiTags('Ratings')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Put('book')
  @ApiOperation({
    summary: 'Upsert rating user login untuk 1 Book (mode rating "book")',
    description: '400 kalau enableRating false ATAU Platform pemilik Book sedang ratingMode="chapter". Upsert by (user_id, book_id): ganti rating lama kalau submit ulang.',
  })
  @ApiOkResponse({ type: BookRatingResponseDto })
  async upsertBookRating(
    @CurrentUser() user: AuthUser,
    @Body() dto: PutBookRatingDto,
  ): Promise<BookRatingResponseDto> {
    return this.ratingsService.upsertBookRating(user.userId, dto);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Rating user login untuk 1 Book (mode "book")', description: '404 kalau user login belum pernah rating Book ini.' })
  @ApiOkResponse({ type: BookRatingResponseDto })
  async findUserBookRating(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
  ): Promise<BookRatingResponseDto> {
    return this.ratingsService.findUserBookRating(user.userId, bookId);
  }

  @Put('chapter')
  @ApiOperation({
    summary: 'Upsert rating user login untuk 1 Chapter (mode rating "chapter")',
    description: '400 kalau enableRating false ATAU Platform pemilik Chapter sedang ratingMode="book". Upsert by (user_id, chapter_id). Ikut menghitung ulang agregat Book (rata-rata SELURUH rating individual semua Chapter-nya).',
  })
  @ApiOkResponse({ type: ChapterRatingResponseDto })
  async upsertChapterRating(
    @CurrentUser() user: AuthUser,
    @Body() dto: PutChapterRatingDto,
  ): Promise<ChapterRatingResponseDto> {
    return this.ratingsService.upsertChapterRating(user.userId, dto);
  }

  @Get('chapter/:chapterId')
  @ApiOperation({ summary: 'Rating user login untuk 1 Chapter (mode "chapter")', description: '404 kalau user login belum pernah rating Chapter ini.' })
  @ApiOkResponse({ type: ChapterRatingResponseDto })
  async findUserChapterRating(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
  ): Promise<ChapterRatingResponseDto> {
    return this.ratingsService.findUserChapterRating(user.userId, chapterId);
  }
}
