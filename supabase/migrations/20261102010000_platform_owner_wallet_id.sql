-- Wallet organisasi penerima donasi per Platform.
-- Nullable agar wallet pemilik lama dapat diisi melalui backfill terkontrol.
ALTER TABLE platforms
    ADD COLUMN IF NOT EXISTS owner_wallet_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_platforms_owner_wallet_id
    ON platforms (owner_wallet_id)
    WHERE owner_wallet_id IS NOT NULL;
