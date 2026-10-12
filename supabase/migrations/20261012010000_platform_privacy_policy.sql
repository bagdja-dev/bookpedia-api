-- Kebijakan Privasi per Platform (halaman publik /privacy-policy reader app).
-- Dibutuhkan Google Play Store: URL kebijakan privasi wajib diisi di Play Console.
ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS privacy_policy TEXT;
