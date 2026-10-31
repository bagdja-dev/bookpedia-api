-- =============================================================
-- Bagdja Bookpedia — Disclaimer Template per Platform (01 Nov 2026)
--
-- Tabel `disclaimer_templates`: satu template = satu nama + konten HTML,
-- milik satu Platform. Dipilih penulis saat membuat/mengedit Book, lalu
-- ditampilkan di halaman detail Book (di bawah sinopsis, di atas tombol
-- aksi) sebagai "sesion disclaimer".
--
-- Kolom `books.disclaimer_template_id` nullable + ON DELETE SET NULL —
-- Book tanpa template tetap valid, dan menghapus template tidak boleh
-- menghapus Book yang memakainya.
-- =============================================================

CREATE TABLE IF NOT EXISTS disclaimer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  nama VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disclaimer_templates_platform_id ON disclaimer_templates(platform_id);

ALTER TABLE books ADD COLUMN IF NOT EXISTS disclaimer_template_id UUID REFERENCES disclaimer_templates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_books_disclaimer_template_id ON books(disclaimer_template_id);
