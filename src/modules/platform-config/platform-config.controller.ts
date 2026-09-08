import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PlatformConfigService } from './platform-config.service';

/**
 * Publik, TANPA auth — title/logo/colors dipakai halaman reader
 * unauthenticated, lockStudio dipakai frontend untuk tampilkan pesan yang
 * sesuai (penegakan sesungguhnya tetap di backend, `LibrariesService`).
 */
@ApiTags('Platform Config')
@Controller('public/config')
export class PlatformConfigController {
  constructor(private readonly service: PlatformConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Konfigurasi platform (title/logo/colors/lockStudio)',
    description:
      'Key-value generik pengaturan level platform, diedit langsung di DB (belum ada novelo-admin). Response berupa object gabungan semua key, bukan array baris.',
  })
  @ApiOkResponse({
    description: 'Object berisi semua key config, mis. { title, logo, colors, lockStudio }',
  })
  async getConfig(): Promise<Record<string, unknown>> {
    return this.service.getAll();
  }
}
