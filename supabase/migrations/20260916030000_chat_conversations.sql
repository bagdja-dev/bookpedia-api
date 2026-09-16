CREATE TYPE chat_conversation_context_type AS ENUM ('peer', 'library');

CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL UNIQUE,
    dm_key VARCHAR NOT NULL UNIQUE,
    context_type chat_conversation_context_type NOT NULL,
    library_id UUID NULL REFERENCES libraries(id) ON DELETE CASCADE,
    initiator_user_id UUID NOT NULL,
    initiator_display_name VARCHAR NULL,
    counterpart_user_id UUID NULL,
    counterpart_display_name VARCHAR NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_initiator ON chat_conversations(initiator_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_counterpart ON chat_conversations(counterpart_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_library ON chat_conversations(library_id);
