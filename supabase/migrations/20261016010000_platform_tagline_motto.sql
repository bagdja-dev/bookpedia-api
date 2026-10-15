-- Tagline and motto shown in each Platform's public reader renderer.

ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS tagline VARCHAR(255),
    ADD COLUMN IF NOT EXISTS motto VARCHAR(255);