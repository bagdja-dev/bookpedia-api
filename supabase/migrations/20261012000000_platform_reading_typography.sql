-- Tipografi bacaan per-Platform (12 Okt 2026) — font, ukuran, jarak baris, jarak antar
-- paragraf, indentasi baris pertama untuk teks bacaan (isi Chapter, sinopsis Book, preview
-- share) di reader app dan editor Studio. NULL = default (tampilan sebelum fitur ini).
-- Bentuk JSON: {"fontFamily":"source-serif-4","fontSize":17,"lineHeight":1.9,
--               "paragraphSpacing":1.25,"firstLineIndent":0}

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS reading_typography JSONB NULL;
