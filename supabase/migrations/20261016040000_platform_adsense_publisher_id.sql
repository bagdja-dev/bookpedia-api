ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS adsense_publisher_id VARCHAR(32);
