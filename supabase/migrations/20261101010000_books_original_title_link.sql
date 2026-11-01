-- =============================================================
-- Bagdja Bookpedia — Book original_title & original_link (01 Nov 2026)
--
-- Kolom tambahan untuk karya terjemahan/adaptasi:
--   original_title : judul karya asli (varchar 255, nullable)
--   original_link  : tautan ke karya asli / sumber (varchar 500, nullable)
-- Keduanya opsional — hanya diisi kalau `book_type` bukan 'original'.
-- =============================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS original_title VARCHAR(255);
ALTER TABLE books ADD COLUMN IF NOT EXISTS original_link VARCHAR(500);
