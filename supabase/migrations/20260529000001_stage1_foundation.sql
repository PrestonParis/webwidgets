-- Stage 1 Foundation Migration
-- Tables: documents, artifacts, file_text_extractions, notifications

-- documents table (structured document storage)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'markdown' CHECK (format IN ('markdown','plain_text','rich_text','json')),
  source_file_id uuid REFERENCES file_uploads(id) ON DELETE SET NULL,
  source_artifact_id uuid, -- FK added after artifacts table created
  folder_id uuid, -- for future folder support
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_source_file_idx ON documents(source_file_id) WHERE source_file_id IS NOT NULL;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents_owner_all'
  ) THEN
    CREATE POLICY "documents_owner_all" ON documents FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
-- artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('summary','cheatsheet','flashcards','study_guide','outline','report','action_plan','extraction','other')),
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  content_format text NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown','json','plain_text')),
  source_file_id uuid REFERENCES file_uploads(id) ON DELETE SET NULL,
  source_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  source_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  parent_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS artifacts_user_idx ON artifacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS artifacts_source_file_idx ON artifacts(source_file_id) WHERE source_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS artifacts_source_job_idx ON artifacts(source_job_id) WHERE source_job_id IS NOT NULL;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artifacts' AND policyname = 'artifacts_owner_all'
  ) THEN
    CREATE POLICY "artifacts_owner_all" ON artifacts FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
-- Add FK from documents to artifacts now that artifacts table exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL;
-- file_text_extractions table
CREATE TABLE IF NOT EXISTS file_text_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  conversion_id uuid, -- references conversion_jobs(id) if text came from conversion
  source_storage_path text NOT NULL,
  extracted_text text NOT NULL DEFAULT '',
  text_format text NOT NULL DEFAULT 'plain_text' CHECK (text_format IN ('plain_text','markdown','html')),
  character_count integer NOT NULL DEFAULT 0,
  token_estimate integer,
  extraction_status text NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending','processing','ready','failed')),
  extraction_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(file_id)
);
CREATE INDEX IF NOT EXISTS file_text_extractions_user_idx ON file_text_extractions(user_id);
CREATE INDEX IF NOT EXISTS file_text_extractions_status_idx ON file_text_extractions(extraction_status);
ALTER TABLE file_text_extractions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_text_extractions' AND policyname = 'file_text_extractions_owner_all'
  ) THEN
    CREATE POLICY "file_text_extractions_owner_all" ON file_text_extractions FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
-- notifications table (persistent job/event notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  href text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_owner_all'
  ) THEN
    CREATE POLICY "notifications_owner_all" ON notifications FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
-- audit_events table (if not already created by another migration)
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}',
  related_entity_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_user_idx ON audit_events(user_id, created_at DESC);
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_events' AND policyname = 'audit_events_owner_all'
  ) THEN
    CREATE POLICY "audit_events_owner_all" ON audit_events FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
-- Full-text search indexes for content search
CREATE INDEX IF NOT EXISTS documents_fts_idx ON documents USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));
CREATE INDEX IF NOT EXISTS artifacts_fts_idx ON artifacts USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));
