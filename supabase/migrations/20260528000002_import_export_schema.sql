-- Import/Export Service Schema
-- Extends import_jobs, adds export_jobs, import_job_logs, export_job_logs,
-- context_exports, and import_export_audit_events tables.

-- ── Extend import_jobs ────────────────────────────────────────────────────────
ALTER TABLE import_jobs
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS destination_type text DEFAULT 'tracking_entries',
  ADD COLUMN IF NOT EXISTS file_upload_id uuid REFERENCES file_uploads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS row_count integer,
  ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warning_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
-- ── import_job_logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_job_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error')),
  message text NOT NULL,
  row_number integer,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS import_job_logs_job ON import_job_logs(import_job_id, created_at);
-- ── export_jobs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL,
  format text NOT NULL CHECK (format IN ('json','csv','xlsx','zip')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','collecting','transforming','generating','ready','delivered','failed','expired','canceled')),
  row_count integer,
  output_url text,
  output_size_bytes integer,
  output_expires_at timestamptz,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_jobs_owner" ON export_jobs FOR ALL USING (auth.uid() = user_id);
-- ── export_job_logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_job_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  export_job_id uuid NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error')),
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS export_job_logs_job ON export_job_logs(export_job_id, created_at);
-- ── context_exports ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS context_exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'personal',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','collecting','ready','empty','failed','unavailable','permission_denied')),
  sources jsonb NOT NULL DEFAULT '[]',
  system_prompt_content text,
  warnings text[] NOT NULL DEFAULT '{}',
  errors text[] NOT NULL DEFAULT '{}',
  available_sources integer NOT NULL DEFAULT 0,
  unavailable_sources integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE context_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "context_exports_owner" ON context_exports FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS context_exports_user_time ON context_exports(user_id, created_at DESC);
-- ── import_export_audit_events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_export_audit_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE import_export_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_owner" ON import_export_audit_events FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS audit_events_user_time ON import_export_audit_events(user_id, created_at DESC);
