-- Exact-payload approval is one atomic, authenticated state transition.

create or replace function public.decide_action_request(
    p_action_request_id uuid,
    p_decision text,
    p_payload jsonb,
    p_payload_hash text,
    p_payload_version integer,
    p_permission_snapshot_hash text,
    p_decided_at timestamptz default now()
)
returns setof public.action_requests
language plpgsql
set search_path = ''
as $$
declare
    target public.action_requests%rowtype;
begin
    if p_decision not in ('approved', 'denied') then
        raise exception 'Unsupported approval decision' using errcode = '22023';
    end if;

    select * into target
    from public.action_requests
    where id = p_action_request_id
      and user_id = auth.uid()
    for update;

    if not found then
        raise exception 'Action request not found' using errcode = '42501';
    end if;

    if target.approval_state = p_decision then
        return query select * from public.action_requests where id = target.id;
        return;
    end if;

    if target.approval_state <> 'required' then
        raise exception 'Action request is no longer awaiting approval'
            using errcode = '23514';
    end if;

    if target.permission_snapshot_hash <> p_permission_snapshot_hash then
        raise exception 'Permission snapshot changed before decision'
            using errcode = '23514';
    end if;

    if p_decision = 'approved' and (
        p_payload is distinct from target.payload
        or p_payload_hash is distinct from target.payload_hash
        or p_payload_version is distinct from target.payload_version
    ) then
        raise exception 'Approved payload does not match the requested payload version'
            using errcode = '23514';
    end if;

    update public.action_requests
    set approval_state = p_decision,
        decided_at = p_decided_at,
        approved_at = case when p_decision = 'approved' then p_decided_at else null end,
        denied_at = case when p_decision = 'denied' then p_decided_at else null end,
        approved_payload = case when p_decision = 'approved' then p_payload else null end,
        approved_payload_hash = case when p_decision = 'approved' then p_payload_hash else null end,
        approved_payload_version = case when p_decision = 'approved' then p_payload_version else null end,
        state_version = state_version + 1
    where id = target.id;

    update public.candidate_actions
    set state = case when p_decision = 'approved' then 'approved' else 'denied' end
    where id = target.candidate_action_id
      and user_id = target.user_id;

    return query select * from public.action_requests where id = target.id;
end;
$$;

revoke all on function public.decide_action_request(
    uuid, text, jsonb, text, integer, text, timestamptz
) from public, anon;
grant execute on function public.decide_action_request(
    uuid, text, jsonb, text, integer, text, timestamptz
) to authenticated;
