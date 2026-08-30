create or replace function public.mark_command_center_seen()
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
    actor uuid := auth.uid();
    seen_at timestamptz := now();
begin
    if actor is null then
        raise exception 'command_center_seen_unauthorized';
    end if;

    insert into public.user_preferences(user_id, preferences, updated_at)
    values (
        actor,
        jsonb_build_object(
            'commandCenter',
            jsonb_build_object('lastSeenAt', seen_at)
        ),
        seen_at
    )
    on conflict (user_id) do update
    set preferences = jsonb_set(
            coalesce(public.user_preferences.preferences, '{}'::jsonb),
            '{commandCenter,lastSeenAt}',
            to_jsonb(seen_at),
            true
        ),
        updated_at = seen_at;

    return seen_at;
end;
$$;

revoke all on function public.mark_command_center_seen() from public, anon;
grant execute on function public.mark_command_center_seen() to authenticated;
