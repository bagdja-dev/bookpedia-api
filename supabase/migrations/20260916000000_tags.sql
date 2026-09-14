-- =============================================================
-- Bagdja Bookpedia — Tag Book (Fase 6), 16 Sep 2026
--
-- Beda dari Genre/Category (taksonomi KURASI, dibuat Owner lewat admin
-- console): Tag adalah folksonomi BEBAS — penulis mana pun boleh
-- menciptakan Tag baru saat menulis Book (find-or-create di service layer,
-- TIDAK ada endpoint CRUD Tag terpisah). Di-scope PER Platform seperti
-- Genre/Category. Relasi ke Book MANY-TO-MANY lewat pivot `book_tags`
-- (satu Book boleh punya banyak Tag) — pola pivot identik `genre_categories`.
-- Lihat plan/bookpedia/overview.md §12.
-- =============================================================

CREATE TABLE IF NOT EXISTS tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id  UUID NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  nama         VARCHAR NOT NULL,
  slug         VARCHAR NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_platform_id ON tags(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_platform_slug ON tags(platform_id, slug);

-- =============================================================
-- book_tags — pivot many-to-many. ON DELETE CASCADE di kedua sisi: hapus
-- Book atau Tag otomatis membersihkan kaitannya saja.
-- =============================================================
CREATE TABLE IF NOT EXISTS book_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_tags_unique ON book_tags(book_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_book_tags_book_id ON book_tags(book_id);
CREATE INDEX IF NOT EXISTS idx_book_tags_tag_id ON book_tags(tag_id);

-- Batas jumlah Tag yang boleh dilekatkan ke satu Book, level Platform.
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS max_tags_per_book INT NOT NULL DEFAULT 5;
