-- =============================================================
-- Bagdja Bookpedia — Genre lookup table (revisi 8 Sep 2026)
-- Menggantikan `books.genre` varchar bebas dengan lookup table
-- `genres`, satu sumber kebenaran (sebelumnya ada 2 daftar genre
-- statis hardcoded di frontend yang tidak sinkron — lihat
-- plan/bookpedia/schema.dbml Table genres Note). Migration sebelumnya:
-- 20260908020000_reading_progress_highlights.sql.
-- =============================================================

-- =============================================================
-- genres — lookup table, diseed 11 genre awal di bawah.
-- =============================================================
CREATE TABLE IF NOT EXISTS genres (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR NOT NULL UNIQUE,
  slug        VARCHAR NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO genres (nama, slug) VALUES
  ('Aksi', 'aksi'),
  ('Drama', 'drama'),
  ('Fantasi', 'fantasi'),
  ('Fiksi Ilmiah', 'fiksi-ilmiah'),
  ('Horor', 'horor'),
  ('Komedi', 'komedi'),
  ('Misteri', 'misteri'),
  ('Non-Fiksi', 'non-fiksi'),
  ('Romance', 'romance'),
  ('Slice of Life', 'slice-of-life'),
  ('Thriller', 'thriller')
ON CONFLICT (nama) DO NOTHING;

-- =============================================================
-- books.genre_id — FK nullable ke genres (ON DELETE SET NULL, Book
-- tanpa genre tetap valid). Ditambah sebagai kolom baru dulu, lalu
-- backfill dari kolom lama `genre` (varchar bebas) sebelum di-drop.
-- =============================================================
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre_id UUID REFERENCES genres(id) ON DELETE SET NULL;

-- Backfill jaga-jaga kalau ada data lama — match case-insensitive
-- (ILIKE) supaya lebih toleran terhadap variasi kapitalisasi.
UPDATE books
SET genre_id = genres.id
FROM genres
WHERE books.genre IS NOT NULL
  AND books.genre_id IS NULL
  AND LOWER(books.genre) = LOWER(genres.nama);

-- Kolom lama `genre` sudah digantikan `genre_id` — drop setelah backfill.
-- (Baris books.genre yang tidak match genre manapun di seed list akan
-- kehilangan nilai genre-nya di sini — dicek & dilaporkan terpisah
-- SEBELUM migration ini dijalankan, lihat catatan eksekusi di execution-plan.md.)
DROP INDEX IF EXISTS idx_books_genre;
ALTER TABLE books DROP COLUMN IF EXISTS genre;

CREATE INDEX IF NOT EXISTS idx_books_genre_id ON books(genre_id);
