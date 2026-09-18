-- =============================================================
-- Bagdja Bookpedia — SEO template defaults + overrides per Platform/Library/Book
-- 20 Sep 2026
--
-- Platform default SEO fields become the root template for all pages of the
-- Platform. Library and Book can override with their own templates using the
-- same placeholder system: {{title}}, {{platform}}, {{library}}, {{author}},
-- {{prefix}}, {{suffix}}.
-- =============================================================

ALTER TABLE platforms
  ADD COLUMN IF NOT EXISTS seo_default_h1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_default_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_default_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_default_og_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_default_og_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_default_og_type VARCHAR(20) NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS seo_prefix TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_suffix TEXT NULL;

ALTER TABLE libraries
  ADD COLUMN IF NOT EXISTS seo_h1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_type VARCHAR(20) NOT NULL DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS seo_prefix TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_suffix TEXT NULL;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS seo_h1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_og_type VARCHAR(20) NOT NULL DEFAULT 'book',
  ADD COLUMN IF NOT EXISTS seo_prefix TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_suffix TEXT NULL;