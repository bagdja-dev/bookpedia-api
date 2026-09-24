import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { PromotionsService } from './promotions.service';
import { PromotedBookSummaryDto } from './dto/promoted-book-summary.dto';
import { ReplacePromotionsDto } from './dto/replace-promotions.dto';

/**
 * "Rekomendasi Penulis" (Studio) — nested di bawah `/books/:bookId` (pola
 * sama `ChaptersController`), scoping ownership sepenuhnya di
 * `PromotionsService` lewat `BooksService.findOneForOwner`.
 */
@ApiTags('Promotions')
@Controller('books/:bookId/promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Book yang dipromosikan penulis di halaman publik Book miliknya (urut posisi tampil)' })
  @ApiOkResponse({ type: PromotedBookSummaryDto, isArray: true })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
  ): Promise<PromotedBookSummaryDto[]> {
    return this.promotionsService.listForOwner(user.userId, bookId);
  }

  @Put()
  @ApiOperation({
    summary: 'Ganti seluruh daftar Book yang dipromosikan (replace-all, bukan add/remove)',
    description:
      'Urutan array = urutan tampil. Book yang dipromosikan BEBAS dari Library manapun di Platform yang sama, harus sudah published + punya minimal 1 Chapter published. Maks 10 Book.',
  })
  @ApiOkResponse({ type: PromotedBookSummaryDto, isArray: true })
  async replace(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: ReplacePromotionsDto,
  ): Promise<PromotedBookSummaryDto[]> {
    return this.promotionsService.replaceForOwner(user.userId, bookId, dto.promotedBookIds);
  }
}
