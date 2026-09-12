import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, PlatformAccessGuard } from '../../common/auth';
import { PlatformDomainsService } from './platform-domains.service';
import { DomainCheckResponseDto, DomainVerificationResponseDto } from './dto/domain-verification-response.dto';

/**
 * Verifikasi kepemilikan Domain Kustom Platform, halaman pengaturan Platform
 * di bookpedia-app Studio. Guard `PlatformAccessGuard` (Owner/Staff platform
 * itu) — sama persis level akses `PlatformsController.update()`.
 */
@ApiTags('Platform Domains')
@Controller('platforms/:platformId/domain')
@UseGuards(JwtAuthGuard, PlatformAccessGuard)
@ApiBearerAuth()
export class PlatformDomainsController {
  constructor(private readonly platformDomainsService: PlatformDomainsService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mulai/ulangi verifikasi domain kustom — return instruksi TXT record + A record untuk ditambahkan Owner di penyedia DNS mereka' })
  @ApiOkResponse({ type: DomainVerificationResponseDto })
  async startVerification(@Param('platformId') platformId: string): Promise<DomainVerificationResponseDto> {
    return this.platformDomainsService.startVerification(platformId);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cek status verifikasi — lookup TXT record sekarang, tandai domain_verified_at kalau cocok' })
  @ApiOkResponse({ type: DomainCheckResponseDto })
  async checkVerification(@Param('platformId') platformId: string): Promise<DomainCheckResponseDto> {
    return this.platformDomainsService.checkVerification(platformId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus domain kustom Platform ini (reset domain, token, dan status verifikasi)' })
  async removeDomain(@Param('platformId') platformId: string): Promise<void> {
    await this.platformDomainsService.removeDomain(platformId);
  }
}
