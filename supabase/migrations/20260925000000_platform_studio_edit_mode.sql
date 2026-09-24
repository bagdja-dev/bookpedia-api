ALTER TABLE platforms
  ADD COLUMN IF NOT EXISTS studio_edit_mode VARCHAR(10) NOT NULL DEFAULT 'auto';

ALTER TABLE platforms
  DROP CONSTRAINT IF EXISTS chk_platforms_studio_edit_mode;

ALTER TABLE platforms
  ADD CONSTRAINT chk_platforms_studio_edit_mode CHECK (studio_edit_mode IN ('auto', 'manual'));