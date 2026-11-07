ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS seo_site_title_suffix VARCHAR(255) DEFAULT 'Baca & Tulis Cerita';
