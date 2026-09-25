ALTER TABLE series ADD COLUMN IF NOT EXISTS library_id UUID;

UPDATE series s
SET library_id = (
    SELECT b.library_id
    FROM book_series bs
    JOIN books b ON b.id = bs.book_id
    WHERE bs.series_id = s.id
    ORDER BY b.created_at ASC
    LIMIT 1
)
WHERE s.library_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'series_library_fk'
    ) THEN
        ALTER TABLE series
        ADD CONSTRAINT series_library_fk
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_series_library_id ON series(library_id);
