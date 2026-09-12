-- =============================================================
-- Bagdja Bookpedia — platform_config.favicon
--
-- Tambahan key baru di platform_config (lihat 20260909020000_platform_config.sql) —
-- URL favicon platform, terpisah dari `logo` (dipakai di header, ukuran/rasio
-- beda dari favicon browser tab). Default null = pakai favicon default Next.js
-- (belum ada sebelumnya), jadi tidak ada perubahan sampai memang diedit
-- manual di DB.
-- =============================================================

INSERT INTO platform_config (key, value) VALUES
  ('favicon', 'null')
ON CONFLICT (key) DO NOTHING;
