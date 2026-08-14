-- Fix mutable search_path on all public functions.
-- An empty search_path prevents search-path injection attacks.

CREATE OR REPLACE FUNCTION public.get_month_day(ts timestamptz)
    RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path = ''
    AS $$
    SELECT to_char(ts AT TIME ZONE 'UTC', 'MM-DD');
$$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
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
CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;
CREATE OR REPLACE FUNCTION public.update_modified_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;
-- Revoke SELECT from anon on all user-data tables.
-- The app requires authentication; no table should be discoverable by
-- unauthenticated requests (REST or GraphQL). Authenticated access and
-- RLS policies are unchanged.
REVOKE SELECT ON TABLE
    public.chess_games,
    public.chess_studies,
    public.chess_variations,
    public.countdowns,
    public.dashboard_layouts,
    public.email_classifications,
    public.habit_completions,
    public.habits,
    public.journals,
    public.mood_logs,
    public.profiles,
    public.quick_notes,
    public.recovery_profiles,
    public.relapses,
    public.study_chapters,
    public.todos,
    public.urges,
    public.user_tokens,
    public.widget_settings
FROM anon;
-- Enable RLS on relapses (policies exist but RLS was not active).
ALTER TABLE public.relapses ENABLE ROW LEVEL SECURITY;
-- Revoke EXECUTE on handle_new_user from anon and authenticated.
-- This function is only meant to be called by its auth.users INSERT trigger,
-- not invoked directly through the REST/GraphQL API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
