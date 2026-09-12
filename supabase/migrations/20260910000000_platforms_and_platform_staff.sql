-- =============================================================
-- Bagdja Bookpedia — Fase 4: platforms & platform_staff (9-10 Sep 2026)
--
-- Tenant baru di ATAS Library — 1 row = 1 "toko"/target pasar (novel,
-- buku teknologi, musik, dst). Mengikuti pola `markets` di
-- bagdja-auction-market APA ADANYA: TANPA kolom kepemilikan sama
-- sekali (owner_user_id/organization_id) — satu org tunggal (pemilik
-- client_app_id Bookpedia) otomatis Owner org-wide atas SEMUA row di
-- tabel ini, diverifikasi runtime via PlatformAccessGuard (bukan
-- disimpan sebagai kolom). Lihat plan/bookpedia/overview.md §9.3 &
-- plan/bookpedia/schema.dbml Table platforms/platform_staff untuk
-- rasional lengkap. Migration sebelumnya: 20260909030000_platform_config_favicon.sql.
--
-- Seed 1 baris default di bawah BUKAN backfill §4.4 (execution-plan.md)
-- — hanya jaminan minimal supaya app selalu punya ≥1 Platform yang bisa
-- di-resolve segera setelah migration ini jalan, di environment manapun.
-- Reconciliation nilai branding aktual dari `platform_config` existing
-- (kalau sudah diedit manual di DB) tetap jadi tugas script backfill
-- §4.4 terpisah, dijalankan setelah kode §4.1 direview & di-deploy.
-- =============================================================

CREATE TABLE IF NOT EXISTS platforms (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                        VARCHAR NOT NULL,
  slug                        VARCHAR NOT NULL UNIQUE,
  logo_url                    VARCHAR,
  favicon_url                 VARCHAR,
  colors                      JSONB NOT NULL,
  lock_studio                 BOOLEAN NOT NULL DEFAULT false,
  renderer_key                VARCHAR NOT NULL DEFAULT 'reader',
  domain                      VARCHAR(255) UNIQUE,
  domain_verification_token   VARCHAR(64),
  domain_verified_at          TIMESTAMPTZ,
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- platform_staff — port PERSIS market_staff: keanggotaan BINER
-- (user ini staff Platform ini, titik), TANPA kolom role. Sub-role
-- staff sengaja ditunda (dikonfirmasi 9 Sep 2026, berlaku nanti
-- sekaligus untuk bagdja-auction-market DAN Bookpedia).
-- =============================================================
CREATE TABLE IF NOT EXISTS platform_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id  UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  email        VARCHAR NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_staff_platform_user ON platform_staff(platform_id, user_id);
CREATE INDEX IF NOT EXISTS idx_platform_staff_platform_id ON platform_staff(platform_id);

-- Platform default — value colors SAMA PERSIS dengan seed platform_config
-- lama (20260909020000_platform_config.sql), supaya tidak ada perubahan
-- visual/perilaku untuk instance yang sudah berjalan sampai memang
-- di-backfill/diedit di §4.4.
INSERT INTO platforms (nama, slug, colors, lock_studio, renderer_key, is_active) VALUES
  ('Bookpedia', 'bookpedia', '{
    "bg": "#fbf6ee",
    "surface": "#fffdf8",
    "foreground": "#2c2114",
    "muted": "#7a6c57",
    "border": "#e6d9c3",
    "terracotta": "#c1502e",
    "terracottaForeground": "#fdf8f0",
    "mustard": "#d79a2c",
    "olive": "#6b7a4c"
  }', false, 'reader', true)
ON CONFLICT (slug) DO NOTHING;
