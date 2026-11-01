-- Move original-work links to JSONB so each entry can store a display label
-- and a URL. Preserve existing single links as one labeled entry.
ALTER TABLE books ADD COLUMN IF NOT EXISTS original_links JSONB;

UPDATE books
SET original_links = jsonb_build_array(
  jsonb_build_object('label', 'Karya Asli', 'link', original_link)
)
WHERE original_link IS NOT NULL
  AND btrim(original_link) <> '';

ALTER TABLE books DROP COLUMN IF EXISTS original_link;
