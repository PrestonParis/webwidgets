-- Background email processing queue (Supabase/Postgres-backed, migrates to Redis Streams in Phase 2)
CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "message_id" text NOT NULL,
    "thread_id" text,
    "history_id" text,
    "stage" text NOT NULL DEFAULT 'ingest'
        CHECK (stage IN ('ingest', 'classify', 'notify', 'dead-letter')),
    "priority" int NOT NULL DEFAULT 0,
    "status" text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    "payload" jsonb,
    "attempts" int NOT NULL DEFAULT 0,
    "last_error" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    UNIQUE ("user_id", "message_id")
);
-- Partial index covering only actionable (pending) rows for fast worker polling
CREATE INDEX IF NOT EXISTS email_queue_work_idx
    ON email_queue (priority DESC, created_at ASC)
    WHERE status = 'pending';
ALTER TABLE "public"."email_queue" OWNER TO "postgres";
ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;
-- Workers use the service role key; app users have no direct access
CREATE POLICY "Service role only"
    ON "public"."email_queue"
    USING (false);
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";
-- Watch-state and identity tracking on user_tokens
ALTER TABLE "public"."user_tokens"
    ADD COLUMN IF NOT EXISTS "last_history_id" text,
    ADD COLUMN IF NOT EXISTS "gmail_email" text,
    ADD COLUMN IF NOT EXISTS "watch_expiry" timestamptz;
