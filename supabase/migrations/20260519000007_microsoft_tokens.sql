-- Add Microsoft Graph token columns to user_tokens
ALTER TABLE "public"."user_tokens"
    ADD COLUMN IF NOT EXISTS "has_microsoft" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "microsoft_access_token" text,
    ADD COLUMN IF NOT EXISTS "microsoft_refresh_token" text;
