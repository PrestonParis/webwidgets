ALTER TABLE "public"."profiles"
    ADD COLUMN IF NOT EXISTS "use_ai_email" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."profiles"
    ADD COLUMN IF NOT EXISTS "anthropic_api_key" "text";
