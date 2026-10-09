-- Perlindungan konten Chapter per-Platform (10 Okt 2026) — diatur Owner/Staff di Platform
-- Settings, diterapkan reader app di area isi Chapter (seleksi teks tetap aktif untuk highlight):
--   block_content_copy        : blok klik kanan + aksi salin/potong di isi Chapter
--   copy_attribution_enabled  : saat disalin, clipboard = potongan teks + tautan sumber
--   copy_attribution_max_chars: panjang maksimal potongan yang ikut tersalin
-- Bila block_content_copy aktif, blokir yang berlaku (atribusi tidak dipakai).

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS block_content_copy BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS copy_attribution_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS copy_attribution_max_chars INTEGER NOT NULL DEFAULT 200
    CHECK (copy_attribution_max_chars BETWEEN 20 AND 2000);
