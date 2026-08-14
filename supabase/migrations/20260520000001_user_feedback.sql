CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id"             uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "what_i_did"     text,
    "what_i_wanted"  text,
    "want_to_see"    text,
    "what_confused"  text,
    "bugs_found"     text,
    "created_at"     timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;
