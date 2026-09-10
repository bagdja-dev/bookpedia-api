-- =============================================================
-- Bagdja Novelo — Fase 4: platform_id di libraries/genres/books (10 Sep 2026)
--
-- Kolom `platform_id` ditambah NULLABLE dengan sengaja — instance yang
-- sudah berjalan (row libraries/genres/books existing) belum punya
-- Platform ter-assign sampai script backfill §4.4 dijalankan. Constraint
-- UNIQUE GLOBAL lama (slug/nama) SENGAJA TIDAK di-drop di sini — tetap
-- hidup berdampingan dengan unique index composite baru di bawah, supaya
-- migration ini aman berdiri sendiri tanpa mengubah perilaku data
-- existing. NOT NULL + backfill + drop constraint lama + DROP TABLE
-- platform_config adalah migration TERPISAH di §4.4, dijalankan setelah
-- kode §4.1 direview & di-deploy — lihat plan/novelo/execution-plan.md
-- §4.4. Migration sebelumnya: 20260910000000_platforms_and_platform_staff.sql.
--
-- ON DELETE RESTRICT (bukan CASCADE/SET NULL) di ketiga FK — sengaja:
-- menghapus Platform yang masih punya Library/Genre/Book WAJIB gagal,
-- cegah kehilangan data tidak sengaja (Owner harus pindahkan/hapus dulu
-- secara eksplisit).
-- =============================================================

ALTER TABLE libraries ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_libraries_platform_id ON libraries(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_libraries_platform_slug ON libraries(platform_id, slug);

ALTER TABLE genres ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_genres_platform_id ON genres(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_genres_platform_slug ON genres(platform_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_genres_platform_nama ON genres(platform_id, nama);

ALTER TABLE books ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_books_platform_id ON books(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_platform_slug ON books(platform_id, slug);
