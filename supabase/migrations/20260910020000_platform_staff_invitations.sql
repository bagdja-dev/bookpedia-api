-- =============================================================
-- Bagdja Bookpedia — Fase 4: platform_staff_invitations (10 Sep 2026)
--
-- Koreksi desain dari rencana awal §4.1 ("invite langsung insert
-- PlatformStaff aktif tanpa email") — ternyata TIDAK BISA dieksekusi
-- persis begitu: `platform_staff.user_id` NOT NULL, dan bagdja-auth
-- TIDAK punya endpoint lookup email->user_id yang bisa dipanggil
-- service-to-service (satu-satunya endpoint pencarian user,
-- GET /auth/users/search/:identifier, cuma menerima JWT user sendiri,
-- bukan client-credential). Jadi `user_id` baru bisa diisi saat invitee
-- klik link accept & login sendiri (JWT mereka memberi userId).
--
-- Tabel ini port PERSIS `market_staff_invitations` (bagdja-auction-api)
-- MINUS infrastruktur email — Owner invite dapat token, share link
-- manual (bukan email otomatis, TIDAK ada MessagingModule di sini).
-- Migration sebelumnya: 20260910010000_libraries_genres_books_platform_id.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS platform_staff_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id  UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  email        VARCHAR NOT NULL,
  invited_by   UUID,
  token        VARCHAR UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  is_accepted  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_staff_invitations_platform_id ON platform_staff_invitations(platform_id);
