import { SetMetadata } from '@nestjs/common';

export const OWNER_ONLY_KEY = 'ownerOnly';

/**
 * Port dari bagdja-auction-api (`OwnerOnly`/`AppAccessGuard`). Menandai
 * endpoint yang hanya boleh diakses Owner (anggota organisasi bagdja-auth
 * pemilik client_app Bookpedia) — Staff Platform ditolak walau terdaftar
 * aktif di `platform_staff` untuk Platform yang dituju. Dicek oleh
 * `PlatformAccessGuard`.
 */
export const OwnerOnly = () => SetMetadata(OWNER_ONLY_KEY, true);
