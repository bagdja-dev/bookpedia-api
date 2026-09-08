-- =============================================================
-- Bagdja Novelo — platform_config
--
-- Key-value generik untuk pengaturan level platform (bukan per-Library) —
-- disepakati 9 Sep 2026: memfasilitasi kemungkinan platform ini nanti
-- di-deploy ulang jadi instance terpisah dengan nama/branding beda (mis.
-- jalur "publisher tertutup" vs "publisher terbuka"), masing-masing
-- instance punya database & baris config sendiri.
--
-- Diedit LANGSUNG di database untuk sekarang (belum ada novelo-admin) —
-- konsisten dengan filosofi key lockStudio di bawah.
-- =============================================================

CREATE TABLE IF NOT EXISTS platform_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 4 key awal — value default SAMA PERSIS dengan yang sudah hardcode di
-- kode saat ini, supaya tidak ada perubahan visual/perilaku sampai memang
-- diedit manual di DB.
INSERT INTO platform_config (key, value) VALUES
  ('title', '"Novelo"'),
  ('logo', 'null'),
  ('colors', '{
    "bg": "#fbf6ee",
    "surface": "#fffdf8",
    "foreground": "#2c2114",
    "muted": "#7a6c57",
    "border": "#e6d9c3",
    "terracotta": "#c1502e",
    "terracottaForeground": "#fdf8f0",
    "mustard": "#d79a2c",
    "olive": "#6b7a4c"
  }'),
  ('lockStudio', 'false')
ON CONFLICT (key) DO NOTHING;
