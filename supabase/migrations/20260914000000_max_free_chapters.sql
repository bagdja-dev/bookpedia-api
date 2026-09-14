-- Fase 5 (SEO) — batas Chapter gratis (bisa dibaca tanpa login).
-- SENTINEL: 0 = SEMUA Chapter gratis (bukan "nol Chapter gratis").
-- Lihat plan/bookpedia/overview.md §11 untuk desain & aturan validasi lengkap.

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS max_free_chapters INT NOT NULL DEFAULT 0;

-- NULL = ikut kebijakan platforms.max_free_chapters apa adanya (tidak override).
ALTER TABLE books ADD COLUMN IF NOT EXISTS max_free_chapters INT NULL;
