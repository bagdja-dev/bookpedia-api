-- =============================================================
-- Bagdja Bookpedia — §4.5: books.category_id (11 Sep 2026)
--
-- Book kini bisa langsung ditandai dengan satu Category (selain genre_id
-- yang sudah ada) — dipilih terpisah di form Book Studio, TIDAK diturunkan
-- otomatis dari kaitan Genre<->Category (`genre_categories`) supaya penulis
-- tetap bebas menentukan Category meski Genre-nya belum/tidak resmi jadi
-- anggota Category itu di pivot.
--
-- Nullable + ON DELETE SET NULL — Book tanpa Category tetap valid, dan
-- menghapus Category tidak boleh menghalangi (RESTRICT) atau menghapus
-- (CASCADE) Book yang memakainya, konsisten pola `books.genre_id`.
-- =============================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);
