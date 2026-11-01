import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, OwnerOnly } from '../../common/auth';
import { DisclaimerTemplatesService } from './disclaimer-templates.service';
import { CreateDisclaimerTemplateDto } from './dto/create-disclaimer-template.dto';
import { UpdateDisclaimerTemplateDto } from './dto/update-disclaimer-template.dto';
import { DisclaimerTemplateResponseDto, DeletedResponseDto } from './dto/disclaimer-template-response.dto';

/**
 * CRUD Disclaimer Template — dua level:
 *  1. Platform (Admin): POST/GET/PATCH/DELETE /platforms/:platformId/disclaimer-templates
 *  2. Library/Studio (Owner): POST/GET/PATCH/DELETE /libraries/:libraryId/disclaimer-templates
 *
 * Guard: JwtAuthGuard + OwnerOnly (mutasi). Akses data di-scoping lewat
 * platformId/libraryId dari URL path.
 */
@Controller()
@ApiTags('Disclaimer Templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisclaimerTemplatesController {
  constructor(private readonly disclaimerTemplatesService: DisclaimerTemplatesService) {}

  /* ================= Platform level ================= */

  @Post('platforms/:platformId/disclaimer-templates')
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat template disclaimer level Platform (Admin/Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, description: 'Template disclaimer berhasil dibuat' })
  async createByPlatform(
    @Param('platformId') platformId: string,
    @Body() dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.createByPlatform(platformId, dto);
  }

  @Get('platforms/:platformId/disclaimer-templates')
  @ApiOperation({ summary: 'List template disclaimer level Platform' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findAllByPlatform(
    @Param('platformId') platformId: string,
  ): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findAllByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('platforms/:platformId/disclaimer-templates/active')
  @ApiOperation({ summary: 'List template disclaimer aktif level Platform (dropdown form Book)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findActiveByPlatform(
    @Param('platformId') platformId: string,
  ): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findActiveByPlatform(platformId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('platforms/:platformId/disclaimer-templates/default')
  @ApiOperation({ summary: 'Template default level Platform' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async findDefaultByPlatform(
    @Param('platformId') platformId: string,
  ): Promise<DisclaimerTemplateResponseDto | null> {
    const template = await this.disclaimerTemplatesService.findDefaultByPlatform(platformId);
    return template ? this.disclaimerTemplatesService.toResponseDto(template) : null;
  }

  @Patch('platforms/:platformId/disclaimer-templates/:id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update template disclaimer level Platform (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async updateByPlatform(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.updateByPlatform(platformId, id, dto);
  }

  @Delete('platforms/:platformId/disclaimer-templates/:id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus template disclaimer level Platform (Owner only)' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async removeByPlatform(
    @Param('platformId') platformId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.disclaimerTemplatesService.removeByPlatform(platformId, id);
  }

  /* ================= Library/Studio level ================= */

  @Post('libraries/:libraryId/disclaimer-templates')
  @OwnerOnly()
  @ApiOperation({ summary: 'Buat template disclaimer level Studio/Library (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, description: 'Template disclaimer berhasil dibuat' })
  async createByLibrary(
    @Param('libraryId') libraryId: string,
    @Body() dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.createByLibrary(libraryId, dto);
  }

  @Get('libraries/:libraryId/disclaimer-templates')
  @ApiOperation({ summary: 'List template disclaimer level Studio/Library' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findAllByLibrary(
    @Param('libraryId') libraryId: string,
  ): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findAllByLibrary(libraryId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('libraries/:libraryId/disclaimer-templates/active')
  @ApiOperation({ summary: 'List template disclaimer aktif level Studio (dropdown form Book)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto, isArray: true })
  async findActiveByLibrary(
    @Param('libraryId') libraryId: string,
  ): Promise<DisclaimerTemplateResponseDto[]> {
    const templates = await this.disclaimerTemplatesService.findActiveByLibrary(libraryId);
    return templates.map((t) => this.disclaimerTemplatesService.toResponseDto(t));
  }

  @Get('libraries/:libraryId/disclaimer-templates/default')
  @ApiOperation({ summary: 'Template default level Studio/Library' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async findDefaultByLibrary(
    @Param('libraryId') libraryId: string,
  ): Promise<DisclaimerTemplateResponseDto | null> {
    const template = await this.disclaimerTemplatesService.findDefaultByLibrary(libraryId);
    return template ? this.disclaimerTemplatesService.toResponseDto(template) : null;
  }

  @Patch('libraries/:libraryId/disclaimer-templates/:id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update template disclaimer level Studio/Library (Owner only)' })
  @ApiOkResponse({ type: DisclaimerTemplateResponseDto })
  async updateByLibrary(
    @Param('libraryId') libraryId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    return this.disclaimerTemplatesService.updateByLibrary(libraryId, id, dto);
  }

  @Delete('libraries/:libraryId/disclaimer-templates/:id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Hapus template disclaimer level Studio/Library (Owner only)' })
  @ApiOkResponse({ type: DeletedResponseDto })
  async removeByLibrary(
    @Param('libraryId') libraryId: string,
    @Param('id') id: string,
  ): Promise<DeletedResponseDto> {
    return this.disclaimerTemplatesService.removeByLibrary(libraryId, id);
  }
}
