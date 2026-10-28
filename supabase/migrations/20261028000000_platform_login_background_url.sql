-- Branding halaman login.bagdja.com per Platform (28 Okt 2026).
-- bagdja-login memanggil GET /public/platforms/:slug/login-branding (template
-- `brandingUrl` client app Bookpedia di console) saat authorize membawa
-- `&brand=<slug>`; logo memakai `logo_url` yang sudah ada, background dari
-- kolom ini. NULL = pakai background default client app / Bagdja.

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS login_background_url TEXT;
