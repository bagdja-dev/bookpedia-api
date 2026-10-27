-- =============================================================
-- Bagdja Bookpedia — Tambah kolom privacy_policy di platforms
-- (27 Okt 2026)
--
-- Kolom `privacy_policy` ditambah NULLABLE untuk konten
-- Kebijakan Privasi publik Platform. Ditampilkan di halaman
-- /privacy-policy reader app, diedit lewat bookpedia-admin.
-- =============================================================

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS privacy_policy TEXT;
