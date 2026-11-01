-- =============================================================
-- Bagdja Bookpedia — Disclaimer Template is_default column (01 Nov 2026)
--
-- Menambah kolom `is_default` ke tabel `disclaimer_templates` yang
-- sudah ada di production. Hanya satu template default per Platform.
-- =============================================================

ALTER TABLE disclaimer_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
