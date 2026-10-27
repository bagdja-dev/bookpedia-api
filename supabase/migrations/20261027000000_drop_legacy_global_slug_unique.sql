-- Drop legacy GLOBAL unique slug constraints on libraries & books.
--
-- Sejak multi-tenant (Fase 4, §4.4) keunikan slug seharusnya PER PLATFORM,
-- dijamin oleh index composite:
--   idx_libraries_platform_slug ON libraries (platform_id, slug)
--   idx_books_platform_slug     ON books     (platform_id, slug)
--
-- Constraint lama dari skema single-tenant masih hidup di DB:
--   libraries_slug_key UNIQUE (slug)
--   books_slug_key     UNIQUE (slug)
--
-- Akibatnya dua Platform tidak boleh punya Library/Book dengan slug yang
-- sama — padahal itu sah (mis. slug "tentang-kami" di novello dan bizact).
-- Kode (LibrariesService.create / BooksService.create) sudah beralih cek
-- per-Platform; migration ini menyelaraskan DB-nya.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS untuk unique constraint; DROP INDEX
-- IF EXISTS untuk berjaga-jaga kalau di DB tertentu bentuknya index lepas
-- (bukan constraint).

ALTER TABLE libraries DROP CONSTRAINT IF EXISTS libraries_slug_key;
DROP INDEX IF EXISTS libraries_slug_key;

ALTER TABLE books DROP CONSTRAINT IF EXISTS books_slug_key;
DROP INDEX IF EXISTS books_slug_key;
