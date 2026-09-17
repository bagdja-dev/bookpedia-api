-- Reading List visibility per user and Book.
-- Existing and new progress rows are private by default.
ALTER TABLE reading_progress
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
