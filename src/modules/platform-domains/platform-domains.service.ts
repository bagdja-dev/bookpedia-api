import { randomBytes } from 'crypto';
import { resolveTxt } from 'dns/promises';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { Platform } from '../../entities/platform.entity';
import { DomainCheckResponseDto, DomainVerificationResponseDto } from './dto/domain-verification-response.dto';
import { TraefikDynamicConfig } from './dto/traefik-dynamic-config.dto';

const TXT_RECORD_PREFIX = '_bagdja-verify.';

/** Layanan publik "what's my IP" — dipanggil DARI server kita sendiri, jadi hasilnya adalah IP publik server ini (bukan IP siapa pun yang sedang membuka pengaturan Platform). Tanpa API key, cuma GET plain-text. */
const IP_LOOKUP_URL = 'https://api.ipify.org';

/**
 * Port dari `DomainsService` (bagdja-auction-api, §4.1, 10 Sep 2026) —
 * verifikasi kepemilikan Domain Kustom Platform, MURNI DNS TXT lookup,
 * TIDAK ADA panggilan API pihak ketiga untuk verifikasi (bukan Coolify,
 * bukan Cloudflare API). TLS domain custom sepenuhnya tanggung jawab
 * Platform Owner sendiri (proxy Cloudflare akun mereka, mode SSL "Full") —
 * modul ini cuma menutup celah "siapa saja bisa klaim domain siapa saja" di
 * `PublicService.resolveByHost()`.
 *
 * Masuk §4.1 (bukan didefer ke §4.3) karena execution-plan.md sendiri
 * eksplisit menaruhnya di checklist §4.1 — kode ini inert (tidak dipanggil
 * siapa pun) sampai infra §4.3 (cron sync Traefik, wildcard DNS) siap
 * memakainya.
 */
@Injectable()
export class PlatformDomainsService {
  /** `CUSTOM_DOMAIN_TARGET_IP` eksplisit di `.env` — override manual, dipakai kalau IP publik server BEDA dari IP egress-nya sendiri (mis. di belakang load balancer/NAT). Kosong = auto-detect lewat `resolveTargetIp()`. */
  private readonly configuredTargetIp: string;
  /** Cache seumur proses — IP publik server yang sedang jalan praktis tidak pernah berubah tanpa restart. */
  private cachedTargetIp: string | null = null;
  /**
   * URL internal (Docker network) `bagdja-bookpedia-app` — dipakai
   * `buildTraefikDynamicConfig()` supaya provider HTTP ini SELF-CONTAINED
   * (definisikan ulang service loadBalancer-nya sendiri), bukan referensi
   * cross-provider `nama@file` (pelajaran §4.4 `custom-domain-setup.md`,
   * bagdja-auction-market — versi pertama tidak pernah benar-benar aktif).
   */
  private readonly bookpediaAppInternalUrl: string;

  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    private readonly config: ConfigService,
  ) {
    this.configuredTargetIp = this.config.get<string>('CUSTOM_DOMAIN_TARGET_IP') || '';
    this.bookpediaAppInternalUrl = this.config.get<string>('BOOKPEDIA_APP_INTERNAL_URL') || '';
  }

  /** Idempotent — reuse token lama kalau sudah pernah generate sebelumnya, jadi TXT record lama yang sudah ditambahkan Owner tetap valid. */
  async startVerification(platformId: string): Promise<DomainVerificationResponseDto> {
    const platform = await this.findPlatformWithDomain(platformId);

    if (!platform.domain_verification_token) {
      platform.domain_verification_token = randomBytes(16).toString('hex');
      await this.platformRepo.save(platform);
    }

    return {
      recordName: `${TXT_RECORD_PREFIX}${platform.domain}`,
      recordValue: platform.domain_verification_token,
      dnsTarget: {
        recordType: 'A',
        recordName: platform.domain as string,
        recordValue: await this.resolveTargetIp(),
      },
    };
  }

  /**
   * IP tujuan A record — `CUSTOM_DOMAIN_TARGET_IP` menang kalau diisi
   * (override manual), kalau kosong auto-detect IP publik server ini
   * sendiri lewat `IP_LOOKUP_URL`. Gagal deteksi (mis. layanan down) →
   * string kosong, biarkan UI tampilkan placeholder-nya sendiri daripada
   * melempar error yang menghentikan seluruh instruksi verifikasi.
   */
  private async resolveTargetIp(): Promise<string> {
    if (this.configuredTargetIp) return this.configuredTargetIp;
    if (this.cachedTargetIp) return this.cachedTargetIp;

    try {
      const response = await fetch(IP_LOOKUP_URL, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`ipify responded ${response.status}`);
      const ip = (await response.text()).trim();
      if (!ip) throw new Error('empty response');
      this.cachedTargetIp = ip;
      return ip;
    } catch {
      return '';
    }
  }

  async checkVerification(platformId: string): Promise<DomainCheckResponseDto> {
    const platform = await this.findPlatformWithDomain(platformId);

    if (!platform.domain_verification_token) {
      throw new BadRequestException('Klik "Verifikasi Domain" dulu untuk mendapatkan TXT record yang perlu ditambahkan');
    }

    let records: string[][];
    try {
      records = await resolveTxt(`${TXT_RECORD_PREFIX}${platform.domain}`);
    } catch {
      throw new BadRequestException(
        'TXT record belum ketemu — DNS mungkin masih propagasi, coba lagi beberapa menit lagi',
      );
    }

    const found = records.some((chunks) => chunks.join('') === platform.domain_verification_token);
    if (!found) {
      throw new BadRequestException(
        'TXT record ketemu tapi nilainya beda — cek lagi di penyedia DNS Anda',
      );
    }

    platform.domain_verified_at = new Date();
    await this.platformRepo.save(platform);

    return { verified: true, domain_verified_at: platform.domain_verified_at };
  }

  /**
   * Dipanggil `TraefikConfigController` (cron/script di host, bukan
   * browser) — satu router Traefik EKSPLISIT per domain custom yang SUDAH
   * terverifikasi. `tls: {}` SENGAJA tanpa `certResolver` — TLS domain
   * custom tetap tanggung jawab Owner sendiri (proxy Cloudflare akun
   * mereka, mode "Full"), origin cukup pakai sertifikat default Traefik apa
   * adanya.
   */
  async buildTraefikDynamicConfig(): Promise<TraefikDynamicConfig> {
    const platforms = await this.platformRepo.find({
      where: { domain: Not(IsNull()), domain_verified_at: Not(IsNull()), is_active: true },
    });

    const serviceName = 'bookpedia-app-custom-domain-svc';
    const routers: TraefikDynamicConfig['http']['routers'] = {};
    for (const platform of platforms) {
      if (!platform.domain) continue;
      routers[`custom-domain-${platform.slug}`] = {
        rule: `Host(\`${platform.domain}\`)`,
        entryPoints: ['https'],
        tls: {},
        service: serviceName,
      };
    }

    // Service didefinisikan SEKALI, dipakai bersama semua router domain
    // custom di atas — cuma dikeluarkan kalau memang ada router yang
    // butuh (`routers` tidak kosong), supaya respons tetap bersih (tidak
    // ada service menggantung tanpa router) saat belum ada domain custom
    // sama sekali.
    const services: TraefikDynamicConfig['http']['services'] =
      Object.keys(routers).length > 0 && this.bookpediaAppInternalUrl
        ? {
            [serviceName]: {
              loadBalancer: {
                passHostHeader: true,
                servers: [{ url: this.bookpediaAppInternalUrl }],
              },
            },
          }
        : {};

    return { http: { routers, services } };
  }

  async removeDomain(platformId: string): Promise<void> {
    const platform = await this.findPlatform(platformId);
    platform.domain = null;
    platform.domain_verification_token = null;
    platform.domain_verified_at = null;
    await this.platformRepo.save(platform);
  }

  private async findPlatform(platformId: string): Promise<Platform> {
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform not found');
    return platform;
  }

  private async findPlatformWithDomain(platformId: string): Promise<Platform> {
    const platform = await this.findPlatform(platformId);
    if (!platform.domain) {
      throw new BadRequestException('Isi dan simpan Domain Kustom dulu di Platform Settings sebelum verifikasi');
    }
    return platform;
  }
}
