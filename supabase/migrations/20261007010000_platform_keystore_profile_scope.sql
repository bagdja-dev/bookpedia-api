ALTER TABLE keystore_profiles
    ADD COLUMN IF NOT EXISTS platform_id UUID NULL REFERENCES platforms(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS key_password_secret_ref VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_keystore_profiles_platform_created
    ON keystore_profiles (platform_id, created_at DESC);