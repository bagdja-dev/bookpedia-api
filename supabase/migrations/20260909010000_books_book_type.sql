-- =============================================================
-- Bagdja Novelo — books.book_type + books.original_author
--
-- Memfasilitasi penulis yang menerjemahkan/mengadaptasi karya orang
-- lain (Library = penerbit/penerjemah, bukan penulis asli) — lihat
-- plan/novelo/schema.dbml Table books & Enum book_type.
-- =============================================================

DO $$ BEGIN
  CREATE TYPE book_type AS ENUM ('original', 'translation', 'adaptation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE books ADD COLUMN IF NOT EXISTS book_type book_type NOT NULL DEFAULT 'original';
ALTER TABLE books ADD COLUMN IF NOT EXISTS original_author VARCHAR(255);
