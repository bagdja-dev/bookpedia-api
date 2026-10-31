import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, OwnerOnly, PlatformId } from '../../common/auth';
import { DisclaimerTemplatesService } from './disclaimer-templates.service';
import { CreateDisclaimerTemplateDto } from './dto/create-disclaimer-template.dto';
import { UpdateDisclaimerTemplateDto } from './dto/update-disclaimer-template.dto';
import { DisclaimerTemplateResponseDto, DeletedResponseDto } from './dto/disclaimer-template-response.dto';

/**
 * CRUD Disclaimer Template ter-autentikasi di Studio — Owner/Staff mengelola
 * template disclaimer per-Platform. `platformId` di-resolve dari middleware
 * (header `x-bookpedia-platform-slug` yang di-forward BFF proxy), bukan dari
 * URL path. Guard hanya `JwtAuthGuard` (pola sama `BooksController`) —
 * scoping data per-Platform dilakukan service lewat `platformId` dari
 * middleware, bukan `PlatformAccessGuard` yang butuh `:platformId` di URL.
 */
@ApiTags('Disclaimer Templates')
@Controller('disclaimer-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisclaimerTemplatesController {
  constructor(private readonly disclaimerTemplatesService: DisclaimerTemplatesService) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat template disclaimer baru (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, description: 'Template disclaimer berhasil dibuat' })
  async create(
    @PlatformId() platformId: string,
    @Body() dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.create(platformId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List template disclaimer milik satu Platform (Owner atau Staff terdaftar)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findAll(@PlatformId() platformId: string): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findAllByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('active')
  @ApiOperation({ summary: 'List template disclaimer aktif (dipakai dropdown pilihan penulis di form Book)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findActive(@PlatformId() platformId: string): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findActiveByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update template disclaimer (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async update(
    @PlatformId() platformId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.update(platformId, id, dto);
  }

  @Delete(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus template disclaimer (Owner only) — Book yang memakainya jadi tanpa disclaimer' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async remove(
    @PlatformId() platformId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.disclaimerTemplatesService.remove(platformId, id);
  }
}
