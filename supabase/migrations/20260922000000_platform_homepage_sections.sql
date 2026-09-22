ALTER TABLE platforms
  ADD COLUMN IF NOT EXISTS homepage_sections JSONB NOT NULL DEFAULT '[
    {"key": "top", "type": "top", "title": "Top / Hot", "enabled": true, "layout": "slider", "limit": 10},
    {"key": "new-updated", "type": "new_updated", "title": "New Updated", "enabled": true, "layout": "slider", "limit": 10}
  ]'::jsonb;