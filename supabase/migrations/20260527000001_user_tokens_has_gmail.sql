ALTER TABLE "public"."user_tokens"
    ADD COLUMN IF NOT EXISTS "has_gmail" boolean DEFAULT false NOT NULL;
