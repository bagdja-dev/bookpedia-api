import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { PlatformsService } from '../platforms/platforms.service';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';

/**
 * Endpoint publik — TANPA autentikasi, pola persis `GenresPublicController`/
 * `CategoriesPublicController`. Dipakai Studio (autocomplete saat mengetik
 * Tag di form Book) — TIDAK ada endpoint CRUD Tag Owner-only (lihat
 * `TagsService` doc-comment: Tag dibuat sebagai efek-samping simpan Book).
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class TagsPublicController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly platformsService: PlatformsService,
  ) {}

  @Get('platforms/:platformSlug/tags')
  @ApiOperation({
    summary: 'Autocomplete/daftar Tag milik satu Platform',
    description:
      'Cari nama ILIKE %search%, urut nama ASC, limit default 20 (maks 50). Tanpa `search`, kembalikan ter-alfabet (BUKAN daftar penuh — jumlah Tag tidak terbatas).',
  })
  @ApiQuery({ name: 'search', required: false, example: 'petualangan' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: TagResponseDto, isArray: true, description: 'Daftar Tag yang cocok' })
  async search(
    @Param('platformSlug') platformSlug: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<TagResponseDto[]> {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const tags = await this.tagsService.search(platform.id, search, Number.isFinite(parsedLimit) ? parsedLimit : undefined);
    return tags.map((tag) => this.tagsService.toResponseDto(tag));
  }
}
