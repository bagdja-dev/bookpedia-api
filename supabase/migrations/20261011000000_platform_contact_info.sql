-- Halaman Kontak per-Platform (11 Okt 2026) — /contact di reader app, diisi Owner/Staff di
-- Platform Settings. NULL = baris kontak tersebut tidak ditampilkan.

ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(30),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
