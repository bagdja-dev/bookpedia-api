import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DnsTargetDto {
  @ApiProperty({ example: 'A' })
  recordType: 'A';

  @ApiProperty({ example: 'teknobuku.com', description: 'Nama domain kustom Platform ini' })
  recordName: string;

  @ApiProperty({ example: '203.0.113.10', description: 'IP tujuan (CUSTOM_DOMAIN_TARGET_IP) — diarahkan lewat A record di penyedia DNS Owner' })
  recordValue: string;
}

/**
 * Response `POST .../domain/verify` — instruksi TXT (bukti kepemilikan) +
 * A record (routing) untuk ditampilkan di UI pengaturan Platform. TLS domain
 * custom TIDAK dibahas di sini sama sekali (tanggung jawab Owner sendiri,
 * lewat proxy Cloudflare akun mereka — didokumentasikan di UI, bukan field
 * API).
 */
export class DomainVerificationResponseDto {
  @ApiProperty({ example: '_bagdja-verify.teknobuku.com', description: 'Nama TXT record yang harus ditambahkan Owner' })
  recordName: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...', description: 'Isi (value) TXT record — token unik Platform ini' })
  recordValue: string;

  @ApiProperty({ type: DnsTargetDto, description: 'A record untuk mengarahkan traffic domain ke platform kita' })
  dnsTarget: DnsTargetDto;
}

/** Response `POST .../domain/check` — status verifikasi setelah lookup TXT record. */
export class DomainCheckResponseDto {
  @ApiProperty({ example: true })
  verified: boolean;

  @ApiPropertyOptional({ example: '2026-09-10T03:00:00.000Z', nullable: true })
  domain_verified_at: Date | null;
}
