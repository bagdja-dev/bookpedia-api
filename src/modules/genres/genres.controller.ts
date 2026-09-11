import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly } from '../../common/auth';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenreResponseDto } from './dto/genre-response.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

/**
 * CRUD Genre ter-autentikasi (§4.5) — melengkapi `GenresPublicController`
 * yang read-only tanpa auth. Pola persis `CategoriesController`: guard
 * `JwtAuthGuard`+`PlatformAccessGuard`, mutasi `@OwnerOnly()`.
 */
@ApiTags('Genres')
@Controller('platforms/:platformId/genres')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat Genre baru (Owner only)' })
  @ApiOkResponse({ type: GenreResponseDto, description: 'Genre berhasil dibuat' })
  async create(
    @Param('platformId') platformId: string,
    @Body() dto: CreateGenreDto,
  ): Promise<GenreResponseDto> {
    return this.genresService.create(platformId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List Genre milik satu Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: GenreResponseDto, isArray: true })
  async findAll(@Param('platformId') platformId: string): Promise<GenreResponseDto[]> {
    const genres = await this.genresService.findAllByPlatform(platformId);
    return genres.map((genre) => this.genresService.toResponseDto(genre));
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update nama/slug Genre (Owner only)' })
  @ApiOkResponse({ type: GenreResponseDto })
  async update(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGenreDto,
  ): Promise<GenreResponseDto> {
    return this.genresService.update(platformId, id, dto);
  }

  @Delete(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus Genre (Owner only) — Book yang memakainya jadi tanpa genre, kaitan Category ikut hilang' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async remove(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.genresService.remove(platformId, id);
  }
}
