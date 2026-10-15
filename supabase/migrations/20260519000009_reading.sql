-- Reading platform: documents, positions, annotations, and plans.
-- Provider-authored documents (NULL user_id) are shared; user_id documents are private uploads.

CREATE TABLE IF NOT EXISTS "public"."reading_documents" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "provider_id"  text NOT NULL,
    "external_id"  text,
    "title"        text NOT NULL,
    "subtitle"     text,
    "author"       text,
    "description"  text,
    "type"         text NOT NULL CHECK (type IN ('religious_text','pdf','epub','web','provider_embed')),
    "language"     text NOT NULL DEFAULT 'en',
    "source"       jsonb NOT NULL DEFAULT '{}',
    "metadata"     jsonb NOT NULL DEFAULT '{}',
    "permissions"  text[] NOT NULL DEFAULT '{}',
    "thumbnail_url" text,
    "total_pages"  integer,
    "created_at"   timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."reading_positions" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id"  uuid NOT NULL REFERENCES reading_documents(id) ON DELETE CASCADE,
    "version_id"   text,
    "position"     jsonb NOT NULL DEFAULT '{}',
    "percent_complete" real NOT NULL DEFAULT 0,
    "time_spent_minutes" integer NOT NULL DEFAULT 0,
    "completed_at" timestamptz,
    "updated_at"   timestamptz DEFAULT now() NOT NULL,
    UNIQUE ("user_id", "document_id")
);
CREATE TABLE IF NOT EXISTS "public"."reading_bookmarks" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id"  uuid NOT NULL REFERENCES reading_documents(id) ON DELETE CASCADE,
    "position"     jsonb NOT NULL DEFAULT '{}',
    "label"        text,
    "color"        text NOT NULL DEFAULT 'blue',
    "citation"     text,
    "created_at"   timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."reading_highlights" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id"  uuid NOT NULL REFERENCES reading_documents(id) ON DELETE CASCADE,
    "position_start" jsonb NOT NULL DEFAULT '{}',
    "position_end"   jsonb NOT NULL DEFAULT '{}',
    "text_snippet" text NOT NULL,
    "color"        text NOT NULL DEFAULT 'yellow',
    "note"         text,
    "citation"     text,
    "created_at"   timestamptz DEFAULT now() NOT NULL,
    "updated_at"   timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."reading_notes" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id"  uuid NOT NULL REFERENCES reading_documents(id) ON DELETE CASCADE,
    "position"     jsonb NOT NULL DEFAULT '{}',
    "position_end" jsonb,
    "content"      text NOT NULL,
    "citation"     text,
    "tags"         text[] NOT NULL DEFAULT '{}',
    "created_at"   timestamptz DEFAULT now() NOT NULL,
    "updated_at"   timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."reading_plans" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title"        text NOT NULL,
    "description"  text,
    "entries"      jsonb NOT NULL DEFAULT '[]',
    "start_date"   date,
    "current_day"  integer NOT NULL DEFAULT 0,
    "streak"       integer NOT NULL DEFAULT 0,
    "is_active"    boolean NOT NULL DEFAULT true,
    "created_at"   timestamptz DEFAULT now() NOT NULL,
    "updated_at"   timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "public"."reading_documents"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reading_positions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reading_bookmarks"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reading_highlights" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reading_notes"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reading_plans"      ENABLE ROW LEVEL SECURITY;
-- Documents: read shared (user_id IS NULL) or own
CREATE POLICY "read documents" ON "public"."reading_documents"
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "manage own documents" ON "public"."reading_documents"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users manage own positions"   ON "public"."reading_positions"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users manage own bookmarks"   ON "public"."reading_bookmarks"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users manage own highlights"  ON "public"."reading_highlights"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users manage own notes"       ON "public"."reading_notes"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users manage own plans"       ON "public"."reading_plans"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS reading_positions_user_doc_idx
    ON "public"."reading_positions" (user_id, document_id);
CREATE INDEX IF NOT EXISTS reading_bookmarks_user_doc_idx
    ON "public"."reading_bookmarks" (user_id, document_id);
CREATE INDEX IF NOT EXISTS reading_highlights_user_doc_idx
    ON "public"."reading_highlights" (user_id, document_id);
CREATE INDEX IF NOT EXISTS reading_notes_user_doc_idx
    ON "public"."reading_notes" (user_id, document_id);
