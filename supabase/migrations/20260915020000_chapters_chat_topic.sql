ALTER TABLE chapters ADD COLUMN IF NOT EXISTS chat_topic_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_chat_topic_id ON chapters(chat_topic_id);