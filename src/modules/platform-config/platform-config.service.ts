import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformConfig } from '../../entities/platform-config.entity';

/**
 * Nama sengaja `PlatformConfigService` (bukan `ConfigService`) — hindari
 * bentrok dengan `ConfigService` bawaan `@nestjs/config` (env var) yang
 * sudah dipakai luas di codebase ini, konsep beda sama sekali.
 */
@Injectable()
export class PlatformConfigService {
  constructor(
    @InjectRepository(PlatformConfig)
    private readonly repo: Repository<PlatformConfig>,
  ) {}

  /** Semua key-value, dipakai `GET /public/config` (satu response object, bukan array baris). */
  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.repo.find();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  /**
   * Baca 1 key untuk pemakaian internal (mis. `LibrariesService` cek
   * `lockStudio`) — `fallback` dipakai kalau key belum ada row-nya di DB
   * sama sekali (bukan kalau value-nya `null`/`false`, itu tetap dianggap
   * ada), supaya default aman ("tidak locked") kalau row belum di-seed.
   */
  async getValue<T = unknown>(key: string, fallback: T): Promise<T> {
    const row = await this.repo.findOne({ where: { key } });
    return row ? (row.value as T) : fallback;
  }
}
