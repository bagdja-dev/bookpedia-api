-- =============================================================
-- Bagdja Bookpedia — Statistik Baca & Rating (Fase 7), 18 Sep 2026
--
-- Statistik baca: hitung MENTAH tiap kali Chapter dibuka (termasuk buka
-- ulang, termasuk pembaca anonim) — chapters.view_count naik BERSAMAAN
-- dengan books.view_count (denormalisasi SUM) via increment() atomik di
-- PublicService, BUKAN read-then-write. Lihat plan/bookpedia/overview.md §13.
--
-- Rating: skala 1-5 bintang, mode diatur per-Platform (`rating_mode`):
--   - 'book'    -> user rating 1x per Book (book_ratings.chapter_id = NULL)
--   - 'chapter' -> user rating 1x per Chapter (book_ratings.chapter_id terisi)
-- SATU tabel `book_ratings` dipakai untuk kedua mode (bukan tabel terpisah)
-- supaya agregat ke level Book selalu dari sumber yang sama. `book_id` SELALU
-- diisi (didenormalisasi dari Chapter-nya di mode 'chapter') supaya agregat
-- per-Book tidak butuh JOIN ke chapters.
--
-- Dua PARTIAL unique index (BUKAN satu UNIQUE(user_id,book_id,chapter_id)
-- biasa) karena Postgres menganggap tiap NULL berbeda — UNIQUE biasa tidak
-- akan menolak baris duplikat ber-chapter_id NULL.
-- =============================================================

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

ALTER TABLE books ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS enable_rating BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS rating_mode VARCHAR(10) NOT NULL DEFAULT 'book';
ALTER TABLE platforms ADD CONSTRAINT chk_platforms_rating_mode CHECK (rating_mode IN ('book', 'chapter'));

CREATE TABLE IF NOT EXISTS book_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id  UUID REFERENCES chapters(id) ON DELETE CASCADE,
  rating      INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_book_ratings_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_ratings_book_mode_uniq
  ON book_ratings(user_id, book_id) WHERE chapter_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_ratings_chapter_mode_uniq
  ON book_ratings(user_id, chapter_id) WHERE chapter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_book_ratings_book_id ON book_ratings(book_id);
