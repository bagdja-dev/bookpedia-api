import { Controller, ForbiddenException, Get, Header, Headers, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import { PlatformDomainsService } from './platform-domains.service';
import { TraefikDynamicConfig, toTraefikYaml } from './dto/traefik-dynamic-config.dto';

/**
 * BUKAN dipanggil browser, BUKAN bagian kontrak API publik
 * (`@ApiExcludeController` — tidak masuk Swagger). Mengembalikan satu
 * router per domain custom Platform yang sudah terverifikasi, supaya
 * Traefik tahu cara meneruskan tiap domain custom ke `bagdja-bookpedia-app`.
 * Inert sampai infra §4.3 (cron sync file dynamic-config Traefik, wildcard
 * DNS `*.bookpedia.bagdja.com`) siap memakainya — lihat docblock
 * `PlatformDomainsService.buildTraefikDynamicConfig()`.
 *
 * `GET /yaml` (yang akan dipakai) — hasilnya ditulis (via cron/script di
 * HOST, BUKAN dipoll Traefik langsung) ke file di direktori
 * `providers.file.directory` Traefik — pola port PERSIS dari
 * bagdja-auction-api (`providers.http` live-poll sudah terbukti gagal
 * total di sana, jangan dicoba lagi, lihat
 * `../architecture/custom-domain-setup.md` §4.4). `GET /` (JSON) tetap
 * dipertahankan untuk debugging manual.
 *
 * Diverifikasi shared secret — terima lewat query param `?token=` ATAU
 * header `x-internal-secret`.
 */
@ApiExcludeController()
@Controller('internal/traefik-config')
export class TraefikConfigController {
  private readonly secret: string;

  constructor(
    private readonly platformDomainsService: PlatformDomainsService,
    private readonly config: ConfigService,
  ) {
    this.secret = this.config.get<string>('TRAEFIK_PROVIDER_SECRET') || '';
  }

  @Get()
  async getConfig(
    @Query('token') tokenQuery?: string,
    @Headers('x-internal-secret') tokenHeader?: string,
  ): Promise<TraefikDynamicConfig> {
    this.assertAuthorized(tokenQuery, tokenHeader);
    return this.platformDomainsService.buildTraefikDynamicConfig();
  }

  @Get('yaml')
  @Header('Content-Type', 'text/yaml; charset=utf-8')
  async getConfigYaml(
    @Query('token') tokenQuery?: string,
    @Headers('x-internal-secret') tokenHeader?: string,
  ): Promise<string> {
    this.assertAuthorized(tokenQuery, tokenHeader);
    const config = await this.platformDomainsService.buildTraefikDynamicConfig();
    return toTraefikYaml(config);
  }

  private assertAuthorized(tokenQuery?: string, tokenHeader?: string): void {
    const provided = tokenQuery || tokenHeader;
    if (!this.secret || provided !== this.secret) {
      throw new ForbiddenException('unauthorized');
    }
  }
}
