import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard, OwnerOnly } from '../../common/auth';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AttachGenreDto } from './dto/attach-genre.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { DeletedResponseDto } from './dto/deleted-response.dto';

@ApiTags('Categories')
@Controller('platforms/:platformId/categories')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat Category baru (Owner only)' })
  @ApiOkResponse({ type: CategoryResponseDto, description: 'Category berhasil dibuat' })
  async create(
    @Param('platformId') platformId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(platformId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List Category milik satu Platform (Owner atau Staff yang terdaftar di platform itu)' })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  async findAll(@Param('platformId') platformId: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAllByPlatform(platformId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu Category (dengan Genre terkait)' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async findOne(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(platformId, id);
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update nama/slug Category (Owner only)' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async update(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(platformId, id, dto);
  }

  @Delete(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus Category (Owner only) — Genre di dalamnya TIDAK ikut terhapus, cuma kaitannya' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async remove(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.categoriesService.remove(platformId, id);
  }

  @Post(':id/genres')
  @OwnerOnly()
  @ApiOperation({ summary: 'Kaitkan Genre existing ke Category ini (Owner only) — TIDAK membuat Genre baru' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async attachGenre(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
    @Body() dto: AttachGenreDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.attachGenre(platformId, id, dto);
  }

  @Delete(':id/genres/:genreId')
  @OwnerOnly()
  @ApiOperation({ summary: 'Lepas kaitan Genre dari Category ini (Owner only) — Genre-nya sendiri tidak terhapus' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async detachGenre(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
    @Param('genreId') genreId: string,
  ): Promise<DeletedResponseDto> {
    return this.categoriesService.detachGenre(platformId, id, genreId);
  }
}
