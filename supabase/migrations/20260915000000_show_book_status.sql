-- Fase 5 (lanjutan) — kontrol tampil/sembunyi badge status cerita
-- (draft/ongoing/completed) di halaman publik, level Platform.

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS show_book_status BOOLEAN NOT NULL DEFAULT true;
