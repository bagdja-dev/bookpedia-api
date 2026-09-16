export interface AuthUser {
  userId: string;
  email?: string;
  username?: string;
  /**
   * Susulan 16 Sep 2026 (Inbox/DM) — cuma terisi lewat jalur OAuth (JWKS/
   * `/auth/me`), token sesi first-party HS256 (`verifyLocalJwt`) TIDAK
   * pernah membawa klaim ini. Lihat `AuthProfileService`.
   */
  avatar?: string;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
  type?: string;
}
