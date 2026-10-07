-- Password keystore per profil (7 Okt 2026) — disimpan TERENKRIPSI di sisi Bookpedia
-- (AES-256-GCM, kunci BOOKPEDIA_SECRETS_ENCRYPTION_KEY), didekripsi hanya saat Owner
-- melihatnya atau sesaat sebelum dikirim ke TWA Builder. Menggantikan secret reference
-- (password_secret_ref / key_password_secret_ref) yang mengharuskan password diset di env
-- builder; kolom lama dipertahankan nullable untuk profil lama.

ALTER TABLE keystore_profiles
    ADD COLUMN IF NOT EXISTS store_password_encrypted TEXT NULL,
    ADD COLUMN IF NOT EXISTS key_password_encrypted TEXT NULL;

ALTER TABLE keystore_profiles ALTER COLUMN password_secret_ref DROP NOT NULL;
