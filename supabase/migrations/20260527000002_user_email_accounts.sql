CREATE TABLE IF NOT EXISTS "public"."user_email_accounts" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "provider" text NOT NULL CHECK (provider IN ('google', 'microsoft')),
    "email" text NOT NULL,
    "display_name" text,
    "access_token" text NOT NULL,
    "refresh_token" text,
    "expires_at" bigint,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    UNIQUE ("user_id", "provider", "email")
);
ALTER TABLE "public"."user_email_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email accounts"
    ON "public"."user_email_accounts"
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
