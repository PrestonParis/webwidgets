-- Conversion Service Schema
-- Creates the conversion_jobs table used by services/conversion.
-- Column names and types match the Drizzle schema in
-- services/conversion/apps/api/src/db/schema.ts exactly.
--
-- The service connects to this database directly via a Drizzle/pg client
-- (service role, bypasses RLS). RLS policies here cover dashboard reads
-- so authenticated users can poll their own job status through the web app.

-- ── conversion_jobs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversion_jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  status              text        NOT NULL DEFAULT 'queued',
  kind                text        NOT NULL DEFAULT 'document',
  original_file_name  text        NOT NULL,
  source_mime         text        NOT NULL,
  source_extension    text        NOT NULL,
  target_extension    text        NOT NULL,
  file_size_bytes     bigint      NOT NULL,
  -- Stored as text to match the Drizzle schema; equals auth.uid()::text for
  -- Supabase-authenticated users. NULL for anonymous/unauthenticated jobs.
  user_id             text,
  input_object_key    text        NOT NULL,
  output_object_key   text,
  error_message       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- ── Check constraints ─────────────────────────────────────────────────────────
-- Mirror the Zod enums in packages/shared/src/schemas.ts so invalid values
-- are rejected at the DB level even if the service skips validation.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversion_jobs_status_check') THEN
    ALTER TABLE conversion_jobs ADD CONSTRAINT conversion_jobs_status_check
      CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));
  END IF;
END; $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversion_jobs_kind_check') THEN
    ALTER TABLE conversion_jobs ADD CONSTRAINT conversion_jobs_kind_check
      CHECK (kind IN ('document', 'image'));
  END IF;
END; $$;
-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Dashboard polling: list all jobs for a user, newest first.
CREATE INDEX IF NOT EXISTS conversion_jobs_user_created_idx
  ON conversion_jobs (user_id, created_at DESC);
-- Cleanup routine in services/cleanup.ts: find expired completed/failed jobs
-- by updated_at. Partial index keeps it small.
CREATE INDEX IF NOT EXISTS conversion_jobs_cleanup_idx
  ON conversion_jobs (updated_at)
  WHERE status IN ('completed', 'failed', 'cancelled');
-- ── updated_at trigger ────────────────────────────────────────────────────────
-- The service sets updated_at explicitly on every write, but a trigger
-- ensures it's always current even if an ad-hoc UPDATE forgets to.
CREATE OR REPLACE FUNCTION set_conversion_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS conversion_jobs_set_updated_at ON conversion_jobs;
CREATE TRIGGER conversion_jobs_set_updated_at
  BEFORE UPDATE ON conversion_jobs
  FOR EACH ROW EXECUTE FUNCTION set_conversion_jobs_updated_at();
-- ── Row-level security ────────────────────────────────────────────────────────
ALTER TABLE conversion_jobs ENABLE ROW LEVEL SECURITY;
-- Authenticated users can read their own jobs.
-- user_id is text; auth.uid() returns uuid — cast required.
DROP POLICY IF EXISTS "conversion_jobs_owner_select" ON conversion_jobs;
CREATE POLICY "conversion_jobs_owner_select"
  ON conversion_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);
-- The conversion service writes via the service role, which bypasses RLS.
-- No INSERT/UPDATE/DELETE policies are needed for the authenticated role.;
