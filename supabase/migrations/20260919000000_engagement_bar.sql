-- =============================================================
-- Bagdja Bookpedia — Engagement Bar: Like + toggle Like/Comment/Share (Fase 8), 14 Sep 2026
--
-- Like: binary per (user, chapter) — beda dari book_ratings (skala 1-5,
-- Fase 7). Unlike = DELETE row-nya (bukan soft-toggle kolom boolean).
-- chapters.like_count/books.like_count naik-turun BERSAMAAN via
-- increment()/decrement() atomik di LikesService (bukan read-then-write).
--
-- Tiga toggle Platform baru (pola identik enable_rating, Fase 7): Owner bisa
-- matikan Like/Comment/Share independen satu sama lain. Comment di sini
-- CUMA mengontrol tampil/sembunyi mock UI (belum ada backend Comment
-- sungguhan — itu domain bagdja-chat-service, lihat plan/chat-service/overview.md).
-- =============================================================

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS enable_like BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS enable_comment BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS enable_share BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS chapter_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  chapter_id  UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_chapter_likes_user_chapter UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_likes_chapter_id ON chapter_likes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_likes_user_id ON chapter_likes(user_id);
