-- View Feature: file metadata and folder schema
-- Enables favorites, archive, tags, notes, and folder organization in the
-- View file manager. Without these tables the UI degrades gracefully
-- (isMissingTableError handling), but features are disabled.

-- ── file_folders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_folders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  parent_id   uuid        REFERENCES file_folders(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS file_folders_user_idx
  ON file_folders (user_id);
CREATE INDEX IF NOT EXISTS file_folders_parent_idx
  ON file_folders (parent_id)
  WHERE parent_id IS NOT NULL;
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "file_folders_owner_all" ON file_folders;
CREATE POLICY "file_folders_owner_all"
  ON file_folders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- ── file_metadata ─────────────────────────────────────────────────────────────
-- Per-file extended metadata keyed by file_uploads.id.
-- Separate table keeps file_uploads schema stable and allows metadata to be
-- added/removed without touching upload records.
CREATE TABLE IF NOT EXISTS file_metadata (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     uuid        NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite    boolean     NOT NULL DEFAULT false,
  archived    boolean     NOT NULL DEFAULT false,
  tags        text[]      NOT NULL DEFAULT '{}',
  notes       text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, user_id)
);
CREATE INDEX IF NOT EXISTS file_metadata_user_idx
  ON file_metadata (user_id);
CREATE INDEX IF NOT EXISTS file_metadata_favorites_idx
  ON file_metadata (user_id)
  WHERE favorite = true;
CREATE INDEX IF NOT EXISTS file_metadata_archived_idx
  ON file_metadata (user_id)
  WHERE archived = true;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "file_metadata_owner_all" ON file_metadata;
CREATE POLICY "file_metadata_owner_all"
  ON file_metadata
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- ── Add folder_id to file_uploads ─────────────────────────────────────────────
-- Optional FK so files can be organized into folders from the View page.
ALTER TABLE file_uploads
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES file_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS file_uploads_folder_idx
  ON file_uploads (folder_id)
  WHERE folder_id IS NOT NULL;
