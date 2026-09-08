-- =============================================================
-- Bagdja Novelo — Initial Schema
-- Fase 0: Fondasi Auth & Library Setup (libraries)
--
-- Hanya tabel `libraries` di migration ini — books/chapters/reading_progress/
-- chapter_highlights (lihat plan/novelo/schema.dbml) BARU dibuat mulai
-- Fase 1+ (execution-plan.md), BUKAN scope Fase 0.
-- =============================================================

-- =============================================================
-- libraries — satu row = satu tenant/penulis (MVP: solo, tanpa
-- multi-staff/co-author)
-- =============================================================
CREATE TABLE IF NOT EXISTS libraries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL,
  nama            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  deskripsi       TEXT,
  cover_url       VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_libraries_owner_user_id ON libraries(owner_user_id);
