revoke update on table public.candidate_actions from authenticated;
revoke insert on table public.candidate_action_reviews from authenticated;

alter function public.edit_candidate_action(uuid, integer, jsonb, text)
    security definer
    set search_path = '';
alter function public.review_candidate_action(uuid, integer, text, text)
    security definer
    set search_path = '';
alter function public.decide_action_request(
    uuid, text, jsonb, text, integer, text, timestamptz
) security definer;

create or replace function public.expire_candidate_actions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    affected integer;
begin
    update public.candidate_actions
    set state = 'expired',
        approved_payload_hash = null,
        approved_payload_version = null,
        reviewed_at = now()
    where user_id = auth.uid()
      and state in ('proposed', 'edited')
      and expires_at <= now();
    get diagnostics affected = row_count;
    return affected;
end;
$$;

revoke all on function public.expire_candidate_actions() from public, anon;
grant execute on function public.expire_candidate_actions() to authenticated;
