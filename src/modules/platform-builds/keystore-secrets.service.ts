import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

/**
 * Enkripsi password keystore di sisi Bookpedia (app client) — AES-256-GCM dengan kunci
 * `BOOKPEDIA_SECRETS_ENCRYPTION_KEY` (32 byte base64, dari secret store deployment).
 * Password disimpan terenkripsi saat profil keystore disimpan, dan hanya didekripsi saat
 * Owner membukanya untuk dilihat atau sesaat sebelum dikirim ke TWA Builder (HTTPS).
 * `aad` mengikat ciphertext ke Platform pemiliknya supaya tidak bisa dipindah ke Platform lain.
 * Format: `v1:<iv>:<authTag>:<ciphertext>` (base64).
 */
@Injectable()
export class KeystoreSecretsService {
  private readonly logger = new Logger(KeystoreSecretsService.name);

  constructor(private readonly config: ConfigService) {}

  encrypt(plaintext: string, aad: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), iv);
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join(':');
  }

  decrypt(envelope: string, aad: string): string {
    const [version, iv, tag, ciphertext] = envelope.split(':');
    if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
      throw new InternalServerErrorException('Format password keystore terenkripsi tidak dikenali');
    }
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.getKey(), Buffer.from(iv, 'base64'));
      decipher.setAAD(Buffer.from(aad, 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
    } catch {
      throw new InternalServerErrorException('Password keystore tidak dapat didekripsi (kunci enkripsi berubah?)');
    }
  }

  private getKey(): Buffer {
    const key = Buffer.from(this.config.get<string>('BOOKPEDIA_SECRETS_ENCRYPTION_KEY') ?? '', 'base64');
    if (key.length !== 32) {
      this.logger.error('BOOKPEDIA_SECRETS_ENCRYPTION_KEY must be 32 bytes encoded as base64');
      throw new InternalServerErrorException('Kunci enkripsi password keystore belum dikonfigurasi');
    }
    return key;
  }
}
