-- File uploads: S3 key + metadata stored here; actual bytes live in AWS S3.
CREATE TABLE file_uploads (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_name  TEXT         NOT NULL,
    mime_type      TEXT         NOT NULL DEFAULT 'application/octet-stream',
    size_bytes     BIGINT       NOT NULL DEFAULT 0,
    s3_key         TEXT         NOT NULL UNIQUE,
    status         TEXT         NOT NULL DEFAULT 'pending'
                                CONSTRAINT file_uploads_status_check
                                CHECK (status IN ('pending', 'uploaded', 'deleted')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_file_uploads_user_date ON file_uploads(user_id, created_at DESC);
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own uploads"
    ON file_uploads FOR ALL
    USING (auth.uid() = user_id);
