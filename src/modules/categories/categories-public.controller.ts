import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PlatformsService } from '../platforms/platforms.service';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

/**
 * Endpoint publik — TANPA autentikasi, pola persis `GenresController`.
 * Disiapkan untuk reader app (`novelo-app`) filter katalog per Category —
 * belum dipakai frontend manapun saat file ini ditulis (di luar scope sesi
 * ini), tapi endpoint-nya murah untuk disiapkan sekalian.
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class CategoriesPublicController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly platformsService: PlatformsService,
  ) {}

  @Get('platforms/:platformSlug/categories')
  @ApiOperation({
    summary: 'Daftar semua Category milik satu Platform (dengan Genre terkait)',
    description: 'Urut nama ASC.',
  })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true, description: 'Daftar Category' })
  async findAllByPlatform(@Param('platformSlug') platformSlug: string): Promise<CategoryResponseDto[]> {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    return this.categoriesService.findAllByPlatform(platform.id);
  }
}
