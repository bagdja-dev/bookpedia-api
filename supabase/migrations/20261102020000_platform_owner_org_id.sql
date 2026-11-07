-- Tenant pemilik tiap Platform. Nullable agar Platform lama dapat di-backfill
-- secara manual sebelum akses berbasis organisasi diwajibkan untuk data lama.
ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS owner_org_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_platforms_owner_org_id
    ON platforms (owner_org_id)
    WHERE owner_org_id IS NOT NULL;
