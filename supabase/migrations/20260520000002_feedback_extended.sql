ALTER TABLE "public"."user_feedback"
    ADD COLUMN IF NOT EXISTS "feedback_type"      text,
    ADD COLUMN IF NOT EXISTS "feature_area"       text,
    ADD COLUMN IF NOT EXISTS "satisfaction_rating" smallint CHECK (satisfaction_rating BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS "general_comment"    text,
    ADD COLUMN IF NOT EXISTS "how_heard"          text;
