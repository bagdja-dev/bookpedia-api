export interface AuthUser {
  userId: string;
  email?: string;
  username?: string;
  /**
   * Susulan 16 Sep 2026 (Inbox/DM) — terisi dari klaim `picture` token OAuth
   * (JWKS) atau `/auth/me`. Lihat `AuthProfileService`.
   */
  avatar?: string;
}
