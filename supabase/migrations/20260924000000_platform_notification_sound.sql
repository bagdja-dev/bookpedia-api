ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS notification_sound_url VARCHAR NULL;
