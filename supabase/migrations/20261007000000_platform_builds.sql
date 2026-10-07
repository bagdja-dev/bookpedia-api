-- Bookpedia platform build configuration and job history.

CREATE TABLE IF NOT EXISTS keystore_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    alias VARCHAR(128) NOT NULL,
    file_ref VARCHAR(255) NOT NULL,
    password_secret_ref VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT keystore_profiles_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS platform_build_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    environment VARCHAR(32) NOT NULL,
    version_name VARCHAR(64) NOT NULL,
    version_code INTEGER NOT NULL,
    keystore_profile_id UUID NULL REFERENCES keystore_profiles(id) ON DELETE SET NULL,
    build_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_build_configs_environment_check CHECK (environment IN ('dev', 'staging', 'prod')),
    CONSTRAINT platform_build_configs_version_code_check CHECK (version_code > 0)
);

CREATE TABLE IF NOT EXISTS platform_build_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    config_id UUID NULL REFERENCES platform_build_configs(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    log_url VARCHAR NULL,
    artifact_url VARCHAR NULL,
    error_message TEXT NULL,
    started_at TIMESTAMPTZ NULL,
    finished_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_build_jobs_status_check CHECK (
        status IN ('queued', 'validating', 'building', 'signing', 'uploading', 'success', 'failed', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_platform_build_configs_platform_created
    ON platform_build_configs (platform_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_build_jobs_platform_created
    ON platform_build_jobs (platform_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_build_jobs_status
    ON platform_build_jobs (status);