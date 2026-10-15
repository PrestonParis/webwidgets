-- Add full body text storage to email_snapshots.
-- The sync-worker stores metadata only; the pipeline fills body_text when
-- it processes a message from the queue (has full Gmail API access).
ALTER TABLE email_snapshots
    ADD COLUMN IF NOT EXISTS body_text text;
COMMENT ON COLUMN email_snapshots.body_text IS
    'Plain-text body decoded from the Gmail/Outlook full-format payload. '
    'Populated by the queue pipeline after ingest. May be NULL for older '
    'snapshots or if body fetch failed.';
