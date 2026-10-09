-- Share Chapter (10 Okt 2026) — halaman preview publik /book/{slug}/chapter/{n}/preview
-- yang dibagikan tombol Share: hanya paragraf pertama Chapter (ramah SEO & kartu sosmed)
-- + tombol login untuk melanjutkan. Kolom ini = panjang maksimal potongan paragraf itu.

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS chapter_preview_max_chars INTEGER NOT NULL DEFAULT 400
    CHECK (chapter_preview_max_chars BETWEEN 100 AND 2000);
