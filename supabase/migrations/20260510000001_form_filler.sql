-- Form-filler profiles: user's stored field values (name, email, address, etc.)
CREATE TABLE IF NOT EXISTS "public"."form_filler_profiles" (
    "id"         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id"    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name"       text        NOT NULL DEFAULT 'Default',
    "fields"     jsonb       NOT NULL DEFAULT '{}',
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS form_filler_profiles_user_idx
    ON form_filler_profiles (user_id);
ALTER TABLE "public"."form_filler_profiles" OWNER TO "postgres";
ALTER TABLE "public"."form_filler_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own profiles"
    ON "public"."form_filler_profiles"
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
GRANT ALL ON TABLE "public"."form_filler_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."form_filler_profiles" TO "service_role";
-- Form-filler jobs: each fill attempt against a URL
CREATE TABLE IF NOT EXISTS "public"."form_filler_jobs" (
    "id"             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id"        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "profile_id"     uuid        REFERENCES form_filler_profiles(id) ON DELETE SET NULL,
    "url"            text        NOT NULL,
    "status"         text        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'done', 'failed')),
    "fields_filled"  jsonb,          -- { fieldName: value } for the fields that were matched
    "screenshot"     text,           -- base64-encoded PNG
    "error"          text,
    "created_at"     timestamptz DEFAULT now() NOT NULL,
    "updated_at"     timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS form_filler_jobs_user_idx
    ON form_filler_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS form_filler_jobs_status_idx
    ON form_filler_jobs (status)
    WHERE status IN ('pending', 'running');
ALTER TABLE "public"."form_filler_jobs" OWNER TO "postgres";
ALTER TABLE "public"."form_filler_jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own jobs"
    ON "public"."form_filler_jobs"
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
GRANT ALL ON TABLE "public"."form_filler_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."form_filler_jobs" TO "service_role";
