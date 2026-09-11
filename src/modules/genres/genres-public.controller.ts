import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PlatformsService } from '../platforms/platforms.service';
import { GenresService } from './genres.service';
import { GenreResponseDto } from './dto/genre-response.dto';

/**
 * Endpoint publik — TANPA autentikasi sama sekali (tidak ada @UseGuards di
 * controller ini), sama seperti PublicModule. Prefix `/public/...` sebagai
 * penanda konsisten "tanpa auth". Dipakai baik novelo-studio (saran genre di
 * form Book) maupun novelo-app (filter katalog) — satu sumber kebenaran,
 * menggantikan 2 daftar genre statis hardcoded di frontend yang sebelumnya
 * tidak sinkron.
 *
 * Fase 4 (§4.1, 10 Sep 2026): route pindah dari `GET public/genres` (global)
 * ke `GET public/platforms/:platformSlug/genres` (per-Platform) — resolusi
 * Platform lewat path param eksplisit, konsisten keputusan resolusi Platform
 * Fase 4 (bukan Host header).
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class GenresPublicController {
  constructor(
    private readonly genresService: GenresService,
    private readonly platformsService: PlatformsService,
  ) {}

  @Get('platforms/:platformSlug/genres')
  @ApiOperation({
    summary: 'Daftar semua genre milik satu Platform',
    description: 'Urut nama ASC. Satu sumber kebenaran untuk genre — dipakai Studio (form Book) & Reader (filter katalog).',
  })
  @ApiOkResponse({ type: GenreResponseDto, isArray: true, description: 'Daftar genre' })
  async findAllByPlatform(@Param('platformSlug') platformSlug: string): Promise<GenreResponseDto[]> {
    const platform = await this.platformsService.findBySlug(platformSlug);
    if (!platform || !platform.is_active) {
      throw new NotFoundException('Platform not found or inactive');
    }
    const genres = await this.genresService.findAllByPlatform(platform.id);
    return genres.map((genre) => this.genresService.toResponseDto(genre));
  }
}
