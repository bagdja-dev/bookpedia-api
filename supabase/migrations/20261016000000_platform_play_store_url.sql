-- URL Google Play Store per Platform untuk link unduh di reader app.

ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS play_store_url TEXT;