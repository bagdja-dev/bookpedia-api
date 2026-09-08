import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { LibrariesService } from './libraries.service';
import { CreateLibraryDto } from './dto/create-library.dto';
import { LibraryResponseDto } from './dto/library-response.dto';

@ApiTags('Libraries')
@Controller('libraries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LibrariesController {
  constructor(private readonly librariesService: LibrariesService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Library baru untuk user login (onboarding penulis, satu Library per user di MVP)' })
  @ApiOkResponse({ type: LibraryResponseDto, description: 'Library berhasil dibuat' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLibraryDto,
  ): Promise<LibraryResponseDto> {
    const library = await this.librariesService.create(user.userId, dto);
    return this.librariesService.toResponseDto(library);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Library milik user login',
    description:
      'Dipakai novelo-studio untuk cek status onboarding. KONTRAK PENTING: kalau user belum punya Library, response 200 dengan body null (BUKAN 404) — jangan diubah, frontend bergantung pada shape ini.',
  })
  @ApiOkResponse({ type: LibraryResponseDto, description: 'Library milik user, atau null kalau belum onboarding' })
  async findMine(@CurrentUser() user: AuthUser): Promise<LibraryResponseDto | null> {
    const library = await this.librariesService.findLibraryByOwner(user.userId);
    return library ? this.librariesService.toResponseDto(library) : null;
  }
}
