import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GenresService } from './genres.service';
import { GenreResponseDto } from './dto/genre-response.dto';

/**
 * Endpoint publik — TANPA autentikasi sama sekali (tidak ada @UseGuards di
 * controller ini), sama seperti PublicModule. Prefix `/public/...` sebagai
 * penanda konsisten "tanpa auth". Dipakai baik novelo-studio (saran genre di
 * form Book) maupun novelo-app (filter katalog) — satu sumber kebenaran,
 * menggantikan 2 daftar genre statis hardcoded di frontend yang sebelumnya
 * tidak sinkron.
 */
@ApiTags('Public (No Auth)')
@Controller('public')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get('genres')
  @ApiOperation({
    summary: 'Daftar semua genre',
    description: 'Urut nama ASC. Satu sumber kebenaran untuk genre — dipakai Studio (form Book) & Reader (filter katalog).',
  })
  @ApiOkResponse({ type: GenreResponseDto, isArray: true, description: 'Daftar genre' })
  async findAll(): Promise<GenreResponseDto[]> {
    const genres = await this.genresService.findAll();
    return genres.map((genre) => this.genresService.toResponseDto(genre));
  }
}
