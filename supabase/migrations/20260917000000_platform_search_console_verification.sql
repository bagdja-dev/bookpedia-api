-- SEO susulan (17 Sep 2026) — verifikasi Google Search Console per-Platform,
-- dinamis (menggantikan file statis di public/ yang dibagikan semua
-- Platform) — perlu karena custom domain adalah fitur inti Bookpedia,
-- setiap Platform Owner boleh verifikasi domainnya sendiri tanpa perlu
-- rebuild/redeploy app. Lihat plan/bookpedia/seo-execution-plan.md §4.

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS search_console_verification_filename VARCHAR;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS search_console_verification_content TEXT;
