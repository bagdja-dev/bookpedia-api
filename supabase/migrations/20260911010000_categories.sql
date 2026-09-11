-- =============================================================
-- Bagdja Novelo — Category (satu level di atas Genre), 11 Sep 2026
--
-- Kelompok besar di ATAS Genre (mis. Category "Fiksi" berisi Genre
-- Fantasi/Horor/Misteri/Thriller) — di-scope PER Platform seperti Genre
-- (taksonomi besar beda-beda antar vertikal novel/buku-teknologi/musik).
-- Relasi Genre<->Category MANY-TO-MANY (satu Genre boleh masuk lebih dari
-- satu Category) via tabel pivot `genre_categories`.
--
-- Tabel BARU tanpa data existing — `platform_id` langsung NOT NULL, TIDAK
-- perlu dance nullable-lalu-backfill seperti Platform/Genre/Book (§4.1).
-- Tidak ada auto-seed default Category (beda dari 11 Genre default) —
-- kosong dulu saat Platform baru, Owner buat manual lewat novelo-admin.
-- =============================================================

CREATE TABLE IF NOT EXISTS categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id  UUID NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  nama         VARCHAR NOT NULL,
  slug         VARCHAR NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_platform_id ON categories(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_platform_slug ON categories(platform_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_platform_nama ON categories(platform_id, nama);

-- =============================================================
-- genre_categories — pivot many-to-many. ON DELETE CASCADE di kedua sisi:
-- hapus Category atau Genre otomatis membersihkan kaitannya saja, TIDAK
-- menghapus baris Genre/Category itu sendiri.
-- =============================================================
CREATE TABLE IF NOT EXISTS genre_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id     UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_genre_categories_unique ON genre_categories(genre_id, category_id);
CREATE INDEX IF NOT EXISTS idx_genre_categories_genre_id ON genre_categories(genre_id);
CREATE INDEX IF NOT EXISTS idx_genre_categories_category_id ON genre_categories(category_id);
