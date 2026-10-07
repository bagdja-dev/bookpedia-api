ALTER TABLE keystore_profiles
    ADD COLUMN IF NOT EXISTS platform_id UUID NULL,
    ADD COLUMN IF NOT EXISTS storage_file_id UUID NULL;

ALTER TABLE platform_build_jobs
    ADD COLUMN IF NOT EXISTS external_job_id VARCHAR(128) NULL,
    ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stage VARCHAR(128) NULL;

CREATE INDEX IF NOT EXISTS idx_platform_build_jobs_external_job_id
    ON platform_build_jobs (external_job_id);