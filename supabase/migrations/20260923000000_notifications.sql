CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    action_label VARCHAR(80) NULL,
    action_url VARCHAR(500) NOT NULL,
    entity_type VARCHAR(80) NULL,
    entity_id VARCHAR(160) NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_severity_check CHECK (severity IN ('info', 'success', 'warning', 'error')),
    CONSTRAINT notifications_action_url_check CHECK (action_url LIKE '/%')
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications (user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type_entity
    ON notifications (user_id, type, entity_id);