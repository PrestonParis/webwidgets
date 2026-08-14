-- Normalized, compact email storage written by the sync worker.
-- Next.js inbox routes read from here instead of hitting Gmail/Outlook live.
CREATE TABLE IF NOT EXISTS "public"."email_snapshots" (
    "id"            text        NOT NULL,               -- "gmail:MSG_ID" | "outlook:MSG_ID"
    "user_id"       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "account_email" text        NOT NULL,
    "provider"      text        NOT NULL CHECK (provider IN ('gmail', 'outlook')),
    "subject"       text        NOT NULL DEFAULT '',
    "sender_email"  text        NOT NULL DEFAULT '',
    "sender_name"   text        NOT NULL DEFAULT '',
    "snippet"       text        NOT NULL DEFAULT '',
    "received_at"   timestamptz NOT NULL,
    "raw_date"      text        NOT NULL DEFAULT '',
    "synced_at"     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id", "id")
);
CREATE INDEX IF NOT EXISTS email_snapshots_received
    ON "public"."email_snapshots" ("user_id", "received_at" DESC);
CREATE INDEX IF NOT EXISTS email_snapshots_provider
    ON "public"."email_snapshots" ("user_id", "provider", "received_at" DESC);
ALTER TABLE "public"."email_snapshots" ENABLE ROW LEVEL SECURITY;
-- Users can only read their own snapshots.
-- Writes come from the sync worker via the service role key (bypasses RLS).
CREATE POLICY "Users read own email snapshots"
    ON "public"."email_snapshots"
    FOR SELECT
    USING (auth.uid() = user_id);
-- Track when each account was last synced.
ALTER TABLE "public"."user_email_accounts"
    ADD COLUMN IF NOT EXISTS "last_synced_at" timestamptz;
