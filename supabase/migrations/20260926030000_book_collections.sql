-- Bookpedia Collection feature (manual collection + author update notifications)
-- Phase 1: core schema for user-owned collections and collection items.

CREATE TABLE IF NOT EXISTS book_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT book_collections_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_book_collections_user_id
    ON book_collections (user_id);

CREATE TABLE IF NOT EXISTS collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES book_collections(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notify_on_author_update BOOLEAN NOT NULL DEFAULT true,
    note TEXT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'saved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT collection_books_collection_book_unique UNIQUE (collection_id, book_id),
    CONSTRAINT collection_books_status_check CHECK (
        status IN ('saved', 'want_to_read', 'reading', 'finished')
    )
);

CREATE INDEX IF NOT EXISTS idx_collection_books_collection_id
    ON collection_books (collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_books_book_id
    ON collection_books (book_id);

CREATE INDEX IF NOT EXISTS idx_collection_books_notify
    ON collection_books (book_id, notify_on_author_update);
