-- Add Google Drive scope tracking to user_tokens
ALTER TABLE "public"."user_tokens"
    ADD COLUMN IF NOT EXISTS "has_drive" boolean DEFAULT false NOT NULL;
