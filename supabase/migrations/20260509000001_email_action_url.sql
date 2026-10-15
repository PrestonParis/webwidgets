ALTER TABLE "public"."email_actions"
    ADD COLUMN IF NOT EXISTS "action_url" "text";
