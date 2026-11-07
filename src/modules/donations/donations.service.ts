import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';

import { Donation } from '../../entities/donation.entity';
import { Platform } from '../../entities/platform.entity';
import { AuthProfileService } from '../user/auth-profile.service';
import { CreateDonationDto, DonationSettingsDto } from './dto/donation-settings.dto';
import {
  DEFAULT_PLATFORM_DONATION_SETTINGS,
  DONATION_LOCATIONS,
  MAX_DONATION_AMOUNT,
  PlatformDonationSettings,
} from './donation.types';

interface PaymentProductResponse {
  id: string;
}

interface PaymentInitializeResponse {
  paymentRequestId: string;
  checkoutUrl: string;
  expiryTime: string;
}

interface PaymentStatusResponse {
  status: string;
  paid_at: string | null;
}

@Injectable()
export class DonationsService {
  private readonly paymentApiUrl: string;
  private readonly readerBaseDomain: string;

  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    private readonly authProfile: AuthProfileService,
    config: ConfigService,
  ) {
    this.paymentApiUrl = (config.get<string>('BAGDJA_PAYMENT_API') ?? 'http://localhost:4006').replace(/\/$/, '');
    this.readerBaseDomain = (config.get<string>('BOOKPEDIA_READER_BASE_DOMAIN') ?? 'bookpedia.bagdja.com')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
  }

  async getSettings(platformId: string) {
    const platform = await this.findPlatform(platformId);
    return {
      settings: this.settingsFor(platform),
      recipientConfigured: Boolean(platform.owner_wallet_id),
    };
  }

  async updateSettings(platformId: string, dto: DonationSettingsDto) {
    const platform = await this.findPlatform(platformId);
    const settings = this.validateSettings(dto);
    if (settings.enabled && !platform.owner_wallet_id) {
      throw new BadRequestException('Atur wallet penerima Platform sebelum mengaktifkan donasi.');
    }

    platform.donation_settings = settings;
    await this.platformRepo.save(platform);
    return {
      settings,
      recipientConfigured: Boolean(platform.owner_wallet_id),
    };
  }

  async createDonation(
    platformSlug: string,
    userId: string,
    dto: CreateDonationDto,
  ) {
    const platform = await this.platformRepo.findOne({
      where: { slug: platformSlug, is_active: true },
    });
    if (!platform) throw new NotFoundException('Platform tidak ditemukan.');
    if (!platform.owner_wallet_id) {
      throw new BadRequestException('Wallet penerima donasi Platform belum diatur.');
    }

    const settings = this.settingsFor(platform);
    if (!settings.enabled) throw new BadRequestException('Donasi belum diaktifkan untuk Platform ini.');
    const option = settings.options.find((item) => item.id === dto.optionId && item.isActive);
    if (!option) throw new BadRequestException('Pilihan donasi tidak tersedia.');

    const amount = this.resolveAmount(option, dto.amount);
    const clientToken = await this.getClientToken();
    const product = await this.requestJson<PaymentProductResponse>(
      '/products/ensure-bookpedia-donation',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-token': clientToken },
        body: JSON.stringify({ platformId: platform.id, platformName: platform.nama }),
      },
    );

    const statusToken = randomBytes(32).toString('hex');
    const donation = this.donationRepo.create({
      platform_id: platform.id,
      payment_request_id: null,
      status: 'INITIALIZING',
      amount,
      currency: 'IDR',
      option_title: option.title,
      status_token_hash: this.hashToken(statusToken),
      paid_at: null,
    });
    const savedDonation = await this.donationRepo.save(donation);
    const returnUrl = `${this.getReaderOrigin(platform)}/donate/result?statusToken=${encodeURIComponent(statusToken)}`;

    try {
      const payment = await this.requestJson<PaymentInitializeResponse>(
        '/payments/initialize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-token': clientToken },
          body: JSON.stringify({
            itemType: 'PRODUCT',
            itemId: product.id,
            amount,
            currency: 'IDR',
            items: [{ name: option.title, qty: 1, price: amount }],
            notes: `Donasi sukarela untuk operasional ${platform.nama}`,
            metadata: {
              purpose: 'bookpedia-platform-donation',
              platformId: platform.id,
              donationId: savedDonation.id,
            },
            userId,
            payeeWalletId: platform.owner_wallet_id,
            successRedirectUrl: returnUrl,
            failureRedirectUrl: returnUrl,
          }),
        },
      );

      savedDonation.payment_request_id = payment.paymentRequestId;
      savedDonation.status = 'PENDING';
      await this.donationRepo.save(savedDonation);
      return {
        checkoutUrl: payment.checkoutUrl,
        statusToken,
        expiryTime: payment.expiryTime,
      };
    } catch (error) {
      savedDonation.status = 'FAILED';
      await this.donationRepo.save(savedDonation);
      if (
        error instanceof BadGatewayException &&
        error.message.includes('payeeWalletId must differ from the app organization wallet')
      ) {
        throw new BadRequestException(
          'Maaf, donasi belum dapat diproses karena wallet penerima donasi masih sama dengan wallet aplikasi Bookpedia. Jika Anda pemilik Platform, silakan hubungi admin untuk mengatur wallet organisasi Platform yang berbeda. Jika bukan, mohon beri tahu pemilik Platform agar memeriksa pengaturan wallet donasi.',
        );
      }
      throw error;
    }
  }

  async getDonationStatus(platformSlug: string, statusToken: string) {
    const platform = await this.platformRepo.findOne({ where: { slug: platformSlug, is_active: true } });
    if (!platform) throw new NotFoundException('Platform tidak ditemukan.');

    const donation = await this.donationRepo.findOne({
      where: { platform_id: platform.id, status_token_hash: this.hashToken(statusToken) },
    });
    if (!donation) throw new NotFoundException('Status donasi tidak ditemukan.');
    if (!donation.payment_request_id) {
      return { status: donation.status, paidAt: null };
    }

    const clientToken = await this.getClientToken();
    const paymentStatus = await this.requestJson<PaymentStatusResponse>(
      `/payments/payment-requests/${encodeURIComponent(donation.payment_request_id)}/status`,
      { headers: { 'x-api-token': clientToken } },
    );
    const status = paymentStatus.status.toUpperCase();
    if (!['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(status)) {
      throw new BadGatewayException('Payment service mengembalikan status donasi yang tidak dikenal.');
    }

    donation.status = status;
    donation.paid_at = paymentStatus.paid_at ? new Date(paymentStatus.paid_at) : null;
    await this.donationRepo.save(donation);
    return { status, paidAt: donation.paid_at?.toISOString() ?? null };
  }

  private async findPlatform(platformId: string): Promise<Platform> {
    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new NotFoundException('Platform tidak ditemukan.');
    return platform;
  }

  private settingsFor(platform: Platform): PlatformDonationSettings {
    const settings = platform.donation_settings ?? DEFAULT_PLATFORM_DONATION_SETTINGS;
    return {
      ...DEFAULT_PLATFORM_DONATION_SETTINGS,
      ...settings,
      locations: [...(settings.locations ?? [])],
      options: (settings.options ?? []).map(({ icon: _legacyIcon, ...option }) => ({ ...option })),
    };
  }

  private validateSettings(dto: DonationSettingsDto): PlatformDonationSettings {
    const title = dto.title.trim();
    const description = dto.description.trim();
    const buttonLabel = dto.buttonLabel.trim();
    if (!title || !buttonLabel) {
      throw new BadRequestException('Judul dan label tombol donasi tidak boleh kosong.');
    }
    if (dto.locations.some((location) => !DONATION_LOCATIONS.includes(location))) {
      throw new BadRequestException('Lokasi penempatan donasi tidak valid.');
    }
    const ids = new Set<string>();
    let activeOptions = 0;
    let customOptions = 0;
    let popularOptions = 0;
    const options = dto.options.map((option) => {
      if (ids.has(option.id)) throw new BadRequestException('ID pilihan donasi harus unik.');
      ids.add(option.id);
      const optionTitle = option.title.trim();
      if (!optionTitle) throw new BadRequestException('Judul pilihan donasi tidak boleh kosong.');
      if (option.isActive) activeOptions += 1;
      if (option.isPopular) popularOptions += 1;
      if (option.type === 'custom') {
        customOptions += 1;
        if (!Number.isInteger(option.multiple) || !option.multiple || option.amount !== undefined) {
          throw new BadRequestException('Nominal kustom harus memiliki kelipatan dan tidak boleh memiliki harga tetap.');
        }
      } else if (!Number.isInteger(option.amount) || !option.amount || option.multiple !== undefined) {
        throw new BadRequestException('Pilihan nominal tetap harus memiliki harga dan tidak boleh memiliki kelipatan.');
      }
      return {
        id: option.id,
        title: optionTitle,
        description: option.description.trim(),
        type: option.type,
        ...(option.amount !== undefined ? { amount: option.amount } : {}),
        ...(option.multiple !== undefined ? { multiple: option.multiple } : {}),
        isActive: option.isActive,
        isPopular: option.isPopular,
        ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
      };
    });
    if (customOptions > 1) throw new BadRequestException('Maksimal satu pilihan nominal kustom.');
    if (popularOptions > 1) throw new BadRequestException('Maksimal satu pilihan dapat ditandai populer.');
    if (dto.enabled && (!dto.locations.length || !activeOptions)) {
      throw new BadRequestException('Donasi aktif memerlukan minimal satu lokasi dan satu pilihan nominal aktif.');
    }

    return {
      enabled: dto.enabled,
      title,
      description,
      buttonLabel,
      locations: [...dto.locations],
      options,
    };
  }

  private resolveAmount(
    option: PlatformDonationSettings['options'][number],
    submittedAmount?: number,
  ): number {
    const amount = option.type === 'fixed' ? option.amount : submittedAmount;
    if (!Number.isInteger(amount) || !amount || amount > MAX_DONATION_AMOUNT) {
      throw new BadRequestException('Nominal donasi tidak valid.');
    }
    if (option.type === 'custom' && (!option.multiple || amount < option.multiple || amount % option.multiple !== 0)) {
      throw new BadRequestException('Nominal kustom harus merupakan kelipatan yang ditentukan.');
    }
    return amount;
  }

  private getReaderOrigin(platform: Platform): string {
    if (platform.domain && platform.domain_verified_at) {
      return `https://${platform.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
    }
    return `https://${platform.slug}.${this.readerBaseDomain}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async getClientToken(): Promise<string> {
    const token = await this.authProfile.getClientToken();
    if (!token) throw new BadGatewayException('Kredensial client Bookpedia belum tersedia untuk Payment Service.');
    return token;
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.paymentApiUrl}${path}`, init);
    } catch {
      throw new BadGatewayException('Tidak dapat terhubung ke Payment Service.');
    }
    const body = await response.json().catch(() => null) as T | { message?: string; error?: string } | null;
    if (!response.ok) {
      const message = body && typeof body === 'object'
        ? ('message' in body ? body.message : 'error' in body ? body.error : undefined)
        : undefined;
      throw new BadGatewayException(
        typeof message === 'string' ? `Payment Service: ${message}` : `Payment Service merespons ${response.status}.`,
      );
    }
    if (!body) throw new BadGatewayException('Payment Service mengembalikan respons kosong atau tidak valid.');
    return body as T;
  }
}
