CREATE TABLE IF NOT EXISTS "public"."email_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_actions_type_check" CHECK (("type" = ANY (ARRAY['action'::"text", 'event'::"text", 'deadline'::"text"]))),
    CONSTRAINT "email_actions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_actions_unique" UNIQUE ("user_id", "email_id", "title")
);
ALTER TABLE "public"."email_actions" OWNER TO "postgres";
ALTER TABLE ONLY "public"."email_actions"
    ADD CONSTRAINT "email_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."email_actions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email actions"
    ON "public"."email_actions"
    USING (("auth"."uid"() = "user_id"))
    WITH CHECK (("auth"."uid"() = "user_id"));
GRANT ALL ON TABLE "public"."email_actions" TO "anon";
GRANT ALL ON TABLE "public"."email_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."email_actions" TO "service_role";
CREATE TABLE IF NOT EXISTS "public"."email_processing_log" (
    "user_id" "uuid" NOT NULL,
    "email_id" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_processing_log_pkey" PRIMARY KEY ("user_id", "email_id")
);
ALTER TABLE "public"."email_processing_log" OWNER TO "postgres";
ALTER TABLE ONLY "public"."email_processing_log"
    ADD CONSTRAINT "email_processing_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."email_processing_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own processing log"
    ON "public"."email_processing_log"
    USING (("auth"."uid"() = "user_id"))
    WITH CHECK (("auth"."uid"() = "user_id"));
GRANT ALL ON TABLE "public"."email_processing_log" TO "anon";
GRANT ALL ON TABLE "public"."email_processing_log" TO "authenticated";
GRANT ALL ON TABLE "public"."email_processing_log" TO "service_role";
ALTER TABLE "public"."user_tokens"
    ADD COLUMN IF NOT EXISTS "has_calendar" boolean DEFAULT false NOT NULL;
