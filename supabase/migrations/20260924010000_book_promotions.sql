CREATE TABLE IF NOT EXISTS book_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    promoted_book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT book_promotions_unique UNIQUE (book_id, promoted_book_id),
    CONSTRAINT book_promotions_not_self CHECK (book_id != promoted_book_id)
);

CREATE INDEX IF NOT EXISTS idx_book_promotions_book_position
    ON book_promotions (book_id, position);
