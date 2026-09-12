-- =============================================================
-- Bagdja Bookpedia — books.published_at
--
-- Saklar publikasi level Book, terpisah dari `status` (label progres
-- narasi draft/ongoing/completed) dan terpisah dari chapters.status
-- per-chapter. Sebelumnya visibilitas Book di /public/* HANYA
-- ditentukan dari "punya >=1 Chapter published" tanpa kontrol level
-- Book — lihat plan/bookpedia/schema.dbml untuk detail.
-- =============================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
