SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE OR REPLACE FUNCTION "public"."get_month_day"("ts" timestamp with time zone) RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  -- We hardcode 'UTC' (or your preferred zone) to make it immutable
  SELECT to_char(ts AT TIME ZONE 'UTC', 'MM-DD');
$$;
ALTER FUNCTION "public"."get_month_day"("ts" timestamp with time zone) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    insert into public.profiles (id, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
new.updated_at = now();
return new;
end;
$$;
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;
ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;
ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."chess_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "white" "text" DEFAULT 'White'::"text" NOT NULL,
    "black" "text" DEFAULT 'Black'::"text" NOT NULL,
    "result" "text",
    "event" "text",
    "site" "text",
    "played_at" "date",
    "pgn" "text" NOT NULL,
    "current_move_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_viewed_at" timestamp with time zone,
    "title" "text"
);
ALTER TABLE "public"."chess_games" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."chess_studies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."chess_studies" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."chess_variations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "uuid",
    "study_id" "uuid",
    "title" "text" DEFAULT 'Variation'::"text" NOT NULL,
    "start_fen" "text" DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'::"text" NOT NULL,
    "branch_move_index" integer,
    "pgn" "text" NOT NULL,
    "annotation" "text",
    "practiced_count" integer DEFAULT 0 NOT NULL,
    "last_practiced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "variation_has_parent" CHECK ((("game_id" IS NOT NULL) OR ("study_id" IS NOT NULL)))
);
ALTER TABLE "public"."chess_variations" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."countdowns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "target_date" timestamp with time zone NOT NULL,
    "emoji" "text" DEFAULT '🎯'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."countdowns" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."dashboard_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "layout" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."dashboard_layouts" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."email_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_id" "text" NOT NULL,
    "sender" "text" NOT NULL,
    "subject" "text",
    "category" "text" NOT NULL,
    "is_manual" boolean DEFAULT false NOT NULL,
    "classified_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."email_classifications" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."habit_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completed_date" "date" DEFAULT CURRENT_DATE NOT NULL
);
ALTER TABLE "public"."habit_completions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "emoji" "text" DEFAULT '✓'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."habits" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);
ALTER TABLE "public"."journals" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."mood_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mood" integer NOT NULL,
    "note" "text",
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logged_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "mood_logs_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);
ALTER TABLE "public"."mood_logs" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."quick_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."quick_notes" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."recovery_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "start_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "addiction" "text"
);
ALTER TABLE "public"."recovery_profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."relapses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "relapsed_at" timestamp with time zone DEFAULT "now"(),
    "tracker_id" "uuid"
);
ALTER TABLE "public"."relapses" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."study_chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Chapter 1'::"text" NOT NULL,
    "pgn" "text" DEFAULT ''::"text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."study_chapters" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone
);
ALTER TABLE "public"."todos" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."urges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "trigger" "text",
    "intensity" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tracker_id" "uuid"
);
ALTER TABLE "public"."urges" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."user_tokens" (
    "user_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" bigint,
    "provider" "text" DEFAULT 'google'::"text"
);
ALTER TABLE "public"."user_tokens" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."widget_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "widget_id" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."widget_settings" OWNER TO "postgres";
ALTER TABLE ONLY "public"."chess_games"
    ADD CONSTRAINT "chess_games_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."chess_studies"
    ADD CONSTRAINT "chess_studies_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."chess_variations"
    ADD CONSTRAINT "chess_variations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."countdowns"
    ADD CONSTRAINT "countdowns_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."email_classifications"
    ADD CONSTRAINT "email_classifications_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."email_classifications"
    ADD CONSTRAINT "email_classifications_unique" UNIQUE ("user_id", "email_id");
ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."mood_logs"
    ADD CONSTRAINT "mood_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_user_unique" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."recovery_profiles"
    ADD CONSTRAINT "recovery_profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."relapses"
    ADD CONSTRAINT "relapses_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."study_chapters"
    ADD CONSTRAINT "study_chapters_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."urges"
    ADD CONSTRAINT "urges_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_tokens"
    ADD CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_user_id_widget_id_key" UNIQUE ("user_id", "widget_id");
CREATE INDEX "chess_games_user_viewed" ON "public"."chess_games" USING "btree" ("user_id", COALESCE("last_viewed_at", "updated_at") DESC);
CREATE INDEX "chess_studies_user" ON "public"."chess_studies" USING "btree" ("user_id", "updated_at" DESC);
CREATE INDEX "chess_variations_game" ON "public"."chess_variations" USING "btree" ("game_id");
CREATE INDEX "chess_variations_study" ON "public"."chess_variations" USING "btree" ("study_id");
CREATE INDEX "chess_variations_user" ON "public"."chess_variations" USING "btree" ("user_id");
CREATE INDEX "countdowns_user_date_idx" ON "public"."countdowns" USING "btree" ("user_id", "target_date");
CREATE INDEX "email_classifications_sender_idx" ON "public"."email_classifications" USING "btree" ("user_id", "sender");
CREATE INDEX "email_classifications_user_id_idx" ON "public"."email_classifications" USING "btree" ("user_id");
CREATE UNIQUE INDEX "habit_completions_unique" ON "public"."habit_completions" USING "btree" ("habit_id", "completed_date");
CREATE INDEX "habit_completions_user_idx" ON "public"."habit_completions" USING "btree" ("user_id", "completed_date" DESC);
CREATE INDEX "idx_journals_deleted_at" ON "public"."journals" USING "btree" ("deleted_at");
CREATE INDEX "idx_journals_month_day" ON "public"."journals" USING "btree" ("public"."get_month_day"("created_at"));
CREATE UNIQUE INDEX "mood_logs_user_date_idx" ON "public"."mood_logs" USING "btree" ("user_id", "logged_date");
CREATE INDEX "study_chapters_study" ON "public"."study_chapters" USING "btree" ("study_id", "position");
CREATE INDEX "todos_created_at_idx" ON "public"."todos" USING "btree" ("user_id", "created_at" DESC);
CREATE INDEX "todos_user_id_idx" ON "public"."todos" USING "btree" ("user_id");
CREATE OR REPLACE TRIGGER "chess_games_updated_at" BEFORE UPDATE ON "public"."chess_games" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "chess_studies_updated_at" BEFORE UPDATE ON "public"."chess_studies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "chess_variations_updated_at" BEFORE UPDATE ON "public"."chess_variations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "study_chapters_updated_at" BEFORE UPDATE ON "public"."study_chapters" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "update_profiles_modtime" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();
CREATE OR REPLACE TRIGGER "update_user_tokens_updated_at" BEFORE UPDATE ON "public"."user_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "widget_settings_updated_at" BEFORE UPDATE ON "public"."widget_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE ONLY "public"."chess_games"
    ADD CONSTRAINT "chess_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."chess_studies"
    ADD CONSTRAINT "chess_studies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."chess_variations"
    ADD CONSTRAINT "chess_variations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."chess_games"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."chess_variations"
    ADD CONSTRAINT "chess_variations_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."chess_studies"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."chess_variations"
    ADD CONSTRAINT "chess_variations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."countdowns"
    ADD CONSTRAINT "countdowns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."email_classifications"
    ADD CONSTRAINT "email_classifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."mood_logs"
    ADD CONSTRAINT "mood_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."recovery_profiles"
    ADD CONSTRAINT "recovery_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."relapses"
    ADD CONSTRAINT "relapses_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "public"."recovery_profiles"("id");
ALTER TABLE ONLY "public"."relapses"
    ADD CONSTRAINT "relapses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."study_chapters"
    ADD CONSTRAINT "study_chapters_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."chess_studies"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."study_chapters"
    ADD CONSTRAINT "study_chapters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."urges"
    ADD CONSTRAINT "urges_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "public"."recovery_profiles"("id");
ALTER TABLE ONLY "public"."urges"
    ADD CONSTRAINT "urges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."user_tokens"
    ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
CREATE POLICY "Users can delete their own journals" ON "public"."journals" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert their own journals" ON "public"."journals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert their profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Users can manage own tokens" ON "public"."user_tokens" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can read own layout" ON "public"."dashboard_layouts" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can read their profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can update own layout" ON "public"."dashboard_layouts" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update their own journals" ON "public"."journals" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update their profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can upsert own layout" ON "public"."dashboard_layouts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can view their own non-deleted journals" ON "public"."journals" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("deleted_at" IS NULL)));
ALTER TABLE "public"."chess_games" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chess_games: delete own" ON "public"."chess_games" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_games: insert own" ON "public"."chess_games" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_games: select own" ON "public"."chess_games" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_games: update own" ON "public"."chess_games" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."chess_studies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chess_studies: delete own" ON "public"."chess_studies" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_studies: insert own" ON "public"."chess_studies" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_studies: select own" ON "public"."chess_studies" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_studies: update own" ON "public"."chess_studies" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."chess_variations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chess_variations: delete own" ON "public"."chess_variations" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_variations: insert own" ON "public"."chess_variations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_variations: select own" ON "public"."chess_variations" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "chess_variations: update own" ON "public"."chess_variations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."countdowns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dashboard_layouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_classifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habit_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mood_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quick_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recovery_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."relapses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_chapters" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_chapters: delete own" ON "public"."study_chapters" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "study_chapters: insert own" ON "public"."study_chapters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "study_chapters: select own" ON "public"."study_chapters" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "study_chapters: update own" ON "public"."study_chapters" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."urges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can delete own profiles" ON "public"."recovery_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "users can delete own relapses" ON "public"."relapses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "relapses"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can delete own urges" ON "public"."urges" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "urges"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can insert own profiles" ON "public"."recovery_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users can insert own relapses" ON "public"."relapses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "relapses"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can insert own urges" ON "public"."urges" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "urges"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can manage their own classifications" ON "public"."email_classifications" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users can select own profiles" ON "public"."recovery_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "users can select own relapses" ON "public"."relapses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "relapses"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can select own urges" ON "public"."urges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recovery_profiles"
  WHERE (("recovery_profiles"."id" = "urges"."tracker_id") AND ("recovery_profiles"."user_id" = "auth"."uid"())))));
CREATE POLICY "users can update own profiles" ON "public"."recovery_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own completions" ON "public"."habit_completions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own countdowns" ON "public"."countdowns" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own habits" ON "public"."habits" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own mood logs" ON "public"."mood_logs" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own notes" ON "public"."quick_notes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "users manage their own todos" ON "public"."todos" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."widget_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "widget_settings: delete own" ON "public"."widget_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "widget_settings: insert own" ON "public"."widget_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "widget_settings: select own" ON "public"."widget_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "widget_settings: update own" ON "public"."widget_settings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."get_month_day"("ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_month_day"("ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_month_day"("ts" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
GRANT ALL ON TABLE "public"."chess_games" TO "anon";
GRANT ALL ON TABLE "public"."chess_games" TO "authenticated";
GRANT ALL ON TABLE "public"."chess_games" TO "service_role";
GRANT ALL ON TABLE "public"."chess_studies" TO "anon";
GRANT ALL ON TABLE "public"."chess_studies" TO "authenticated";
GRANT ALL ON TABLE "public"."chess_studies" TO "service_role";
GRANT ALL ON TABLE "public"."chess_variations" TO "anon";
GRANT ALL ON TABLE "public"."chess_variations" TO "authenticated";
GRANT ALL ON TABLE "public"."chess_variations" TO "service_role";
GRANT ALL ON TABLE "public"."countdowns" TO "anon";
GRANT ALL ON TABLE "public"."countdowns" TO "authenticated";
GRANT ALL ON TABLE "public"."countdowns" TO "service_role";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "service_role";
GRANT ALL ON TABLE "public"."email_classifications" TO "anon";
GRANT ALL ON TABLE "public"."email_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_classifications" TO "service_role";
GRANT ALL ON TABLE "public"."habit_completions" TO "anon";
GRANT ALL ON TABLE "public"."habit_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_completions" TO "service_role";
GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";
GRANT ALL ON TABLE "public"."journals" TO "anon";
GRANT ALL ON TABLE "public"."journals" TO "authenticated";
GRANT ALL ON TABLE "public"."journals" TO "service_role";
GRANT ALL ON TABLE "public"."mood_logs" TO "anon";
GRANT ALL ON TABLE "public"."mood_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."mood_logs" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."quick_notes" TO "anon";
GRANT ALL ON TABLE "public"."quick_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_notes" TO "service_role";
GRANT ALL ON TABLE "public"."recovery_profiles" TO "anon";
GRANT ALL ON TABLE "public"."recovery_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."recovery_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."relapses" TO "anon";
GRANT ALL ON TABLE "public"."relapses" TO "authenticated";
GRANT ALL ON TABLE "public"."relapses" TO "service_role";
GRANT ALL ON TABLE "public"."study_chapters" TO "anon";
GRANT ALL ON TABLE "public"."study_chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."study_chapters" TO "service_role";
GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";
GRANT ALL ON TABLE "public"."urges" TO "anon";
GRANT ALL ON TABLE "public"."urges" TO "authenticated";
GRANT ALL ON TABLE "public"."urges" TO "service_role";
GRANT ALL ON TABLE "public"."user_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tokens" TO "service_role";
GRANT ALL ON TABLE "public"."widget_settings" TO "anon";
GRANT ALL ON TABLE "public"."widget_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_settings" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
drop extension if exists "pg_net";
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
