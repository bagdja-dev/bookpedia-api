-- =============================================================
-- Bagdja Novelo — Fase 1: Writer Tulis & Kelola Book/Chapter
-- Tabel `books` & `chapters` (lihat plan/novelo/schema.dbml &
-- execution-plan.md Fase 1). Migration `libraries` sebelumnya:
-- 20260908000000_init_libraries.sql.
-- =============================================================

-- =============================================================
-- books — satu row = satu karya (Book) milik satu Library.
-- `slug` UNIK GLOBAL lintas platform (bukan per-library) — dipakai
-- di URL publik `/book/{slug}` mulai Fase 2.
-- =============================================================
CREATE TABLE IF NOT EXISTS books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id    UUID NOT NULL REFERENCES libraries(id),
  judul         VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  sinopsis      TEXT,
  genre         VARCHAR(100),
  cover_url     VARCHAR(500),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'ongoing', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_library_id ON books(library_id);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);

-- =============================================================
-- chapters — satu row = satu bab milik satu Book. `ON DELETE CASCADE`
-- di `book_id` supaya hapus Book otomatis membersihkan Chapter-nya
-- (belum perlu cascade eksplisit di kode service, cukup FK ini).
--
-- UNIQUE(book_id, order_index) sengaja DEFERRABLE INITIALLY DEFERRED —
-- endpoint reorder (`PATCH .../chapters/reorder`) melakukan banyak UPDATE
-- order_index dalam satu transaction; kalau constraint di-cek per-statement
-- (default Postgres), swap urutan antar dua Chapter (mis. A:1<->B:2) akan
-- gagal di tengah karena sempat melewati state duplikat sementara. Dengan
-- DEFERRABLE, constraint baru dicek saat COMMIT — state akhir tetap wajib
-- unik, tapi state antara di dalam transaction bebas.
-- =============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id           UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  judul             VARCHAR(255) NOT NULL,
  konten            TEXT NOT NULL DEFAULT '',
  order_index       INTEGER NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published')),
  content_version   INTEGER NOT NULL DEFAULT 1,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chapters_book_id_order_index_key UNIQUE (book_id, order_index) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
