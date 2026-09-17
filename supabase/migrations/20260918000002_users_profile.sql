-- Local profile projection for identities owned by bagdja-auth.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id UUID NOT NULL UNIQUE,
  email VARCHAR(320),
  username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url VARCHAR(1000),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at DESC);
