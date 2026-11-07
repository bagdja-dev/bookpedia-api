import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthProfileService } from "../../modules/user/auth-profile.service";
import { Platform } from "../../entities/platform.entity";
import { AssignPlatformOwnerWalletDto } from "./dto/assign-platform-owner-wallet.dto";
import { CreatePlatformOwnerOrganizationDto } from "./dto/create-platform-owner-organization.dto";

export interface Organization {
  id: string;
  name: string;
  orgId: string;
  isActive: boolean;
  isSystemOrg: boolean;
  role?: { slug?: string };
}

interface Wallet {
  id: string;
  org_id: string | null;
  currency_code: string;
  is_active: boolean;
}

export interface PlatformOwnerWalletSettings {
  ownerWalletId: string | null;
  walletError?: string;
  selectedOrgSlug?: string;
  organizations: Array<Pick<Organization, "id" | "name" | "orgId">>;
}

export interface InitializedOrganizationWallet {
  walletId: string;
  orgId: string;
  currencyCode: string;
  isActive: boolean;
}

@Injectable()
export class PlatformOwnerWalletService {
  private readonly authApiUrl: string;
  private readonly paymentApiUrl: string;

  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    private readonly authProfile: AuthProfileService,
    config: ConfigService,
  ) {
    this.authApiUrl = (
      config.get<string>("BAGDJA_AUTH_API") ??
      config.get<string>("BAGDJA_AUTH_URL") ??
      "http://localhost:4001"
    ).replace(/\/$/, "");
    this.paymentApiUrl = (
      config.get<string>("BAGDJA_PAYMENT_API") ?? "http://localhost:4006"
    ).replace(/\/$/, "");
  }

  async getSettings(
    platformId: string,
    authorization: string,
  ): Promise<PlatformOwnerWalletSettings> {
    const platform = await this.getPlatform(platformId);
    const organizations = await this.getOwnerOrganizations(authorization);
    if (!platform.owner_org_id) {
      throw new BadRequestException('Platform ini belum memiliki organisasi tenant. Selesaikan backfill terlebih dahulu.');
    }
    const ownerOrganization = organizations.find((organization) => organization.id === platform.owner_org_id);
    if (!ownerOrganization) {
      throw new BadRequestException('User harus menjadi Owner organisasi tenant Platform untuk mengelola wallet penerima.');
    }
    let selectedOrgSlug: string | undefined = ownerOrganization.orgId;
    let walletError: string | undefined;

    if (platform.owner_wallet_id) {
      const clientToken = await this.getClientToken();
      const wallet = await this.requestJson<Wallet>(
        `${this.paymentApiUrl}/wallets/${encodeURIComponent(platform.owner_wallet_id)}`,
        { headers: { "x-api-token": clientToken } },
        "bagdja-payment-service",
      );
      if (
        wallet.id !== platform.owner_wallet_id ||
        wallet.currency_code !== "IDR"
      ) {
        walletError = "Wallet penerima Platform tidak valid.";
      } else if (
        wallet.org_id !== ownerOrganization.orgId &&
        wallet.org_id !== ownerOrganization.id
      ) {
        walletError =
          'Wallet tertaut bukan milik organisasi tenant Platform. Buat dan tautkan wallet organisasi tenant untuk memperbaikinya.';
      } else if (wallet.is_active !== true) {
        walletError =
          'Wallet penerima organisasi tenant Platform belum aktif. Tautkan wallet organisasi tenant yang aktif untuk memperbaikinya.';
      }
    }

    return {
      ownerWalletId: platform.owner_wallet_id,
      walletError,
      selectedOrgSlug,
      organizations: [{ id: ownerOrganization.id, name: ownerOrganization.name, orgId: ownerOrganization.orgId }],
    };
  }

  async listOwnerOrganizations(authorization: string): Promise<Array<Pick<Organization, 'id' | 'name' | 'orgId'>>> {
    return (await this.getOwnerOrganizations(authorization)).map(({ id, name, orgId }) => ({ id, name, orgId }));
  }

  async createOrganization(
    authorization: string,
    dto: CreatePlatformOwnerOrganizationDto,
  ): Promise<Pick<Organization, 'id' | 'name' | 'orgId'>> {
    const clientToken = await this.getClientToken();
    const organization = await this.requestJson<Organization>(
      `${this.authApiUrl}/auth/organizations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': clientToken,
          Authorization: authorization,
        },
        body: JSON.stringify(dto),
      },
      'bagdja-auth',
    );
    if (!organization.id || !organization.orgId || organization.role?.slug?.toLowerCase() !== 'owner') {
      throw new BadGatewayException('bagdja-auth tidak mengembalikan organisasi dengan role Owner.');
    }
    return { id: organization.id, name: organization.name, orgId: organization.orgId };
  }

  async assignExistingOrganization(
    platformId: string,
    authorization: string,
    dto: AssignPlatformOwnerWalletDto,
  ): Promise<PlatformOwnerWalletSettings> {
    const platform = await this.getPlatform(platformId);
    if (!platform.owner_org_id) {
      throw new BadRequestException('Platform ini belum memiliki organisasi tenant. Selesaikan backfill terlebih dahulu.');
    }
    const organizations = await this.getOwnerOrganizations(authorization);
    const organization = organizations.find(
      (org) => org.orgId === dto.orgSlug && org.id === platform.owner_org_id,
    );
    if (!organization) {
      throw new BadRequestException(
        'Pilih organisasi tenant Platform yang Anda miliki.',
      );
    }

    await this.assignWallet(platformId, organization.orgId);
    return this.getSettings(platformId, authorization);
  }

  async initializeOwnerOrganizationWallet(
    platformId: string,
    authorization: string,
  ): Promise<InitializedOrganizationWallet> {
    const platform = await this.getPlatform(platformId);
    if (!platform.owner_org_id) {
      throw new BadRequestException(
        'Platform ini belum memiliki organisasi tenant. Selesaikan backfill terlebih dahulu.',
      );
    }

    const organization = (await this.getOwnerOrganizations(authorization)).find(
      (org) => org.id === platform.owner_org_id,
    );
    if (!organization) {
      throw new BadRequestException(
        'Hanya Owner organisasi tenant Platform yang dapat menyiapkan wallet.',
      );
    }

    const wallet = await this.getOrCreateOrganizationWallet(organization.orgId);
    return {
      walletId: wallet.id,
      orgId: organization.orgId,
      currencyCode: wallet.currency_code,
      isActive: wallet.is_active,
    };
  }

  async clearWallet(platformId: string): Promise<void> {
    const platform = await this.getPlatform(platformId);
    platform.owner_wallet_id = null;
    await this.platformRepo.save(platform);
  }

  private async assignWallet(
    platformId: string,
    orgSlug: string,
  ): Promise<void> {
    const platform = await this.getPlatform(platformId);
    const wallet = await this.getOrCreateOrganizationWallet(orgSlug);

    platform.owner_wallet_id = wallet.id;
    await this.platformRepo.save(platform);
  }

  private async getOrCreateOrganizationWallet(orgSlug: string): Promise<Wallet> {
    const clientToken = await this.getClientToken();
    const wallet = await this.requestJson<Wallet>(
      `${this.paymentApiUrl}/wallets/organization/${encodeURIComponent(orgSlug)}/IDR?currency=IDR`,
      { headers: { "x-api-token": clientToken } },
      "bagdja-payment-service",
    );

    if (
      !wallet.id ||
      wallet.org_id !== orgSlug ||
      wallet.currency_code !== "IDR" ||
      wallet.is_active !== true
    ) {
      throw new BadGatewayException(
        "Wallet organisasi IDR tidak valid atau belum aktif.",
      );
    }

    return wallet;
  }

  private async getOwnerOrganizations(
    authorization: string,
  ): Promise<Organization[]> {
    const clientToken = await this.getClientToken();
    const organizations = await this.requestJson<Organization[]>(
      `${this.authApiUrl}/auth/organizations`,
      { headers: { "x-api-token": clientToken, Authorization: authorization } },
      "bagdja-auth",
    );

    if (!Array.isArray(organizations)) {
      throw new BadGatewayException(
        "bagdja-auth mengembalikan daftar organisasi dengan format tidak valid.",
      );
    }

    return organizations.filter(
      (org) =>
        org.isActive &&
        !org.isSystemOrg &&
        org.role?.slug?.toLowerCase() === "owner" &&
        typeof org.orgId === "string" &&
        org.orgId.length > 0,
    );
  }

  private async getClientToken(): Promise<string> {
    const token = await this.authProfile.getClientToken();
    if (!token) {
      throw new BadGatewayException(
        "Kredensial client Bookpedia untuk layanan Auth tidak tersedia.",
      );
    }
    return token;
  }

  private async getPlatform(platformId: string): Promise<Platform> {
    const platform = await this.platformRepo.findOne({
      where: { id: platformId },
    });
    if (!platform) throw new NotFoundException("Platform not found");
    return platform;
  }

  private async requestJson<T>(
    url: string,
    init: RequestInit,
    serviceName: string,
  ): Promise<T> {
    const response = await fetch(url, init);
    const responseText = await response.text();
    let responseBody: unknown;
    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new BadGatewayException(
        `${serviceName} mengembalikan respons JSON yang tidak valid.`,
      );
    }

    if (!response.ok) {
      const body = responseBody as { message?: string; error?: string } | null;
      const details = body?.message ?? body?.error ?? `HTTP ${response.status}`;
      throw new BadGatewayException(`${serviceName} gagal: ${details}`);
    }
    if (responseBody === null) {
      throw new BadGatewayException(
        `${serviceName} mengembalikan respons kosong.`,
      );
    }
    return responseBody as T;
  }
}
