-- =============================================================
-- Bagdja Bookpedia — Disclaimer Template library_id (01 Nov 2026)
--
-- Menambah kolom `library_id` ke tabel `disclaimer_templates` untuk
-- mendukung template disclaimer level Studio/Library (selain level
-- Platform yang sudah ada). Hanya salah satu dari platform_id atau
-- library_id yang diisi (mutual exclusive).
-- =============================================================

ALTER TABLE disclaimer_templates ADD COLUMN IF NOT EXISTS library_id UUID REFERENCES libraries(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_disclaimer_templates_library_id ON disclaimer_templates(library_id);
