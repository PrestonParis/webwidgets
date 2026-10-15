-- user_integration_keys: stores API keys for third-party service integrations
-- Follows the same pattern as user_model_keys (provider + encrypted key)
CREATE TABLE IF NOT EXISTS "public"."user_integration_keys" (
    "id"         uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id"    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "provider"   text NOT NULL,
    "api_key"    text NOT NULL,
    "label"      text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    UNIQUE ("user_id", "provider")
);
ALTER TABLE "public"."user_integration_keys" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own integration keys"
    ON "public"."user_integration_keys"
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_integration_keys_user_id_idx
    ON "public"."user_integration_keys" (user_id);
