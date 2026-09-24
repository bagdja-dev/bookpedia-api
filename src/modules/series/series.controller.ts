import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, type AuthUser } from '../../common/auth';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { SeriesDetailDto } from './dto/series-detail.dto';
import { SeriesService } from './series.service';

class SeriesSummaryDto {
  id: string;
  nama: string;
  bookCount: number;
  createdAt: string;
  updatedAt: string;
}

@ApiTags('Series')
@Controller('series')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua series yang berlaku di platform Studio user' })
  @ApiOkResponse({ type: SeriesSummaryDto, isArray: true })
  async list(@CurrentUser() user: AuthUser): Promise<SeriesSummaryDto[]> {
    return this.seriesService.listForOwner(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Buat series baru di platform Studio' })
  @ApiOkResponse({ type: SeriesDetailDto })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSeriesDto): Promise<SeriesDetailDto> {
    return this.seriesService.createForOwner(user.userId, dto);
  }

  @Get(':seriesId')
  @ApiOperation({ summary: 'Ambil detail series dan daftar Book yang masuk ke series tersebut' })
  @ApiOkResponse({ type: SeriesDetailDto })
  async getOne(@CurrentUser() user: AuthUser, @Param('seriesId') seriesId: string): Promise<SeriesDetailDto> {
    return this.seriesService.getForOwner(user.userId, seriesId);
  }

  @Put(':seriesId')
  @ApiOperation({ summary: 'Ganti nama dan daftar buku di sebuah series' })
  @ApiOkResponse({ type: SeriesDetailDto })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('seriesId') seriesId: string,
    @Body() dto: UpdateSeriesDto,
  ): Promise<SeriesDetailDto> {
    return this.seriesService.updateForOwner(user.userId, seriesId, dto);
  }

  @Delete(':seriesId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus series' })
  async remove(@CurrentUser() user: AuthUser, @Param('seriesId') seriesId: string): Promise<void> {
    await this.seriesService.removeForOwner(user.userId, seriesId);
  }
}
