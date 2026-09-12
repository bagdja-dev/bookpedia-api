-- =============================================================
-- Bagdja Bookpedia — Fase 3: Reading Progress & Highlight
-- Tabel `reading_progress` & `chapter_highlights` (lihat
-- plan/bookpedia/schema.dbml & execution-plan.md Fase 3). Migration
-- sebelumnya: 20260908010000_books_chapters.sql.
-- =============================================================

-- =============================================================
-- reading_progress — 1 row per (user, book), di-upsert saat pembaca
-- pindah/scroll chapter (resume baca otomatis / tombol "Lanjutkan Baca").
-- `ON DELETE CASCADE` di book_id & last_chapter_id supaya hapus Book/Chapter
-- otomatis membersihkan progress terkait. `user_id` sengaja tanpa FK
-- (identitas asli dikelola bagdja-auth, pola sama seperti libraries.owner_user_id).
-- =============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  book_id           UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  last_chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reading_progress_user_id_book_id_key UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);

-- =============================================================
-- chapter_highlights — "member marker": highlight/stabilo teks per pembaca.
-- `content_version` adalah SNAPSHOT content_version Chapter SAAT highlight
-- dibuat — dibandingkan dengan content_version Chapter saat ini untuk
-- soft-hide anti-drift di HighlightsService (highlight tidak dihapus, cuma
-- disembunyikan saat render kalau Chapter sudah direvisi penulis).
-- =============================================================
CREATE TABLE IF NOT EXISTS chapter_highlights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  chapter_id        UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  start_offset      INTEGER NOT NULL,
  end_offset        INTEGER NOT NULL,
  content_version   INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapter_highlights_user_id_chapter_id ON chapter_highlights(user_id, chapter_id);
