CREATE TABLE IF NOT EXISTS series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL,
    nama VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT series_platform_fk FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL,
    book_id UUID NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT book_series_series_fk FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
    CONSTRAINT book_series_book_fk FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    CONSTRAINT book_series_unique UNIQUE (series_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_series_platform_id ON series(platform_id);
CREATE INDEX IF NOT EXISTS idx_book_series_series_id ON book_series(series_id);
CREATE INDEX IF NOT EXISTS idx_book_series_book_id ON book_series(book_id);
