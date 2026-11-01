import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, OwnerOnly } from '../../common/auth';
import { DisclaimerTemplatesService } from './disclaimer-templates.service';
import { CreateDisclaimerTemplateDto } from './dto/create-disclaimer-template.dto';
import { UpdateDisclaimerTemplateDto } from './dto/update-disclaimer-template.dto';
import { DisclaimerTemplateResponseDto, DeletedResponseDto } from './dto/disclaimer-template-response.dto';

/**
 * CRUD Disclaimer Template ter-autentikasi di Studio — Owner/Staff mengelola
 * template disclaimer per-Platform. `platformId` diambil dari URL path
 * (`/platforms/:platformId/disclaimer-templates`), guard `PlatformAccessGuard`
 * memastikan user punya akses ke Platform tersebut (pola sama controllers
 * lainnya di Admin Studio).
 */
@ApiTags('Disclaimer Templates')
@Controller('platforms/:platformId/disclaimer-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisclaimerTemplatesController {
  constructor(private readonly disclaimerTemplatesService: DisclaimerTemplatesService) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat template disclaimer baru (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, description: 'Template disclaimer berhasil dibuat' })
  async create(
    @Param('platformId') platformId: string,
    @Body() dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.create(platformId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List template disclaimer milik satu Platform (Owner atau Staff terdaftar)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findAll(@Param('platformId') platformId: string): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findAllByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('active')
  @ApiOperation({ summary: 'List template disclaimer aktif (dipakai dropdown pilihan penulis di form Book)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findActive(@Param('platformId') platformId: string): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findActiveByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update template disclaimer (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async update(
    @Param('platformId') platformId: string,
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
    @Param('platformId') platformId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.disclaimerTemplatesService.remove(platformId, id);
  }
}
