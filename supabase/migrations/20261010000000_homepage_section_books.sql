-- Homepage section mode "manual" (10 Okt 2026) — Owner/Staff memilih Book satu per satu
-- untuk section homepage (bukan berdasarkan query). Section-nya tetap tersimpan di
-- platforms.homepage_sections (JSONB) dan diacu lewat `id` permanen (UUID) section itu,
-- bukan `key`, supaya ganti judul/key tidak memutus isi list. Book yang dihapus otomatis
-- keluar dari list (ON DELETE CASCADE); Book yang di-unpublish dilewati saat render.
-- Pola sama book_promotions ("Rekomendasi Penulis").

CREATE TABLE IF NOT EXISTS homepage_section_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT homepage_section_books_unique UNIQUE (section_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_homepage_section_books_section_position
    ON homepage_section_books (platform_id, section_id, position);
