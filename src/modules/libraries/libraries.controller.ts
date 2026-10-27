import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard, CurrentUser, PlatformId, type AuthUser } from '../../common/auth';
import { LibrariesService } from './libraries.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { LibraryResponseDto } from './dto/library-response.dto';
import { LibraryAnalyticsResponseDto } from './dto/library-analytics.dto';

@ApiTags('Libraries')
@Controller('libraries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LibrariesController {
  constructor(private readonly librariesService: LibrariesService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Library baru untuk user login (onboarding penulis, satu Library per user PER PLATFORM di MVP)' })
  @ApiOkResponse({ type: LibraryResponseDto, description: 'Library berhasil dibuat' })
  async create(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Body() dto: CreateLibraryDto,
  ): Promise<LibraryResponseDto> {
    const library = await this.librariesService.create(user.userId, dto, platformId);
    return this.librariesService.toResponseDto(library);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Library milik user login',
    description:
      'Dipakai bookpedia-studio untuk cek status onboarding. KONTRAK PENTING: kalau user belum punya Library, response 200 dengan body literal null (BUKAN 404, BUKAN body kosong) — jangan diubah, frontend bergantung pada shape ini.',
  })
  @ApiOkResponse({ type: LibraryResponseDto, description: 'Library milik user, atau null kalau belum onboarding' })
  async findMine(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Res() res: Response,
  ): Promise<void> {
    const library = await this.librariesService.findLibraryByOwner(user.userId, platformId);
    res.status(HttpStatus.OK).json(library ? this.librariesService.toResponseDto(library) : null);
  }

  @Get('me/analytics')
  @ApiOperation({ summary: 'Statistik agregat Library milik user login' })
  @ApiOkResponse({ type: LibraryAnalyticsResponseDto })
  async analytics(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
  ): Promise<LibraryAnalyticsResponseDto> {
    return this.librariesService.getAnalytics(user.userId, platformId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update Library milik user login (halaman Pengaturan Studio)',
    description: 'Semua field body opsional. Slug TIDAK bisa diubah lewat endpoint ini (dipakai di URL publik, hanya ditentukan saat create).',
  })
  @ApiOkResponse({ type: LibraryResponseDto, description: 'Library terbaru setelah diupdate' })
  async updateMine(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Body() dto: UpdateLibraryDto,
  ): Promise<LibraryResponseDto> {
    const library = await this.librariesService.update(user.userId, dto, platformId);
    return this.librariesService.toResponseDto(library);
  }
}
