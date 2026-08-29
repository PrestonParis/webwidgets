create table public.calendar_action_dispatches (
    action_request_id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    account_id uuid not null,
    payload_hash text not null,
    state text not null default 'reserved' check(state in ('reserved','unknown','failed','verified','cancelled')),
    provider_object_id text,receipt jsonb,undo_state text not null default 'not_available'
        check(undo_state in ('not_available','available','requested','completed','failed')),
    reserved_at timestamptz not null default now(),updated_at timestamptz not null default now(),
    foreign key(action_request_id,user_id) references public.action_requests(id,user_id) on delete cascade
);
alter table public.calendar_action_dispatches enable row level security;
revoke all on public.calendar_action_dispatches from public,anon,authenticated;
grant select on public.calendar_action_dispatches to authenticated;
grant all on public.calendar_action_dispatches to service_role;
create policy calendar_dispatch_owner_read on public.calendar_action_dispatches
    for select to authenticated using(user_id=auth.uid());

create function public.assert_calendar_action_account(p_user_id uuid,p_payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare account public.user_email_accounts%rowtype;connection public.integration_connections%rowtype;
begin
    select * into account from public.user_email_accounts
    where id=(p_payload->>'accountId')::uuid and user_id=p_user_id;
    if not found then raise exception 'calendar_account_forbidden'; end if;
    select * into connection from public.integration_connections
    where id=account.integration_connection_id and user_id=p_user_id;
    if not found or account.provider<>'google' or p_payload->>'provider'<>'google'
       or p_payload->>'calendarId'<>'primary' or account.provider_subject is null
       or connection.disabled_at is not null or connection.disconnected_at is not null
       or connection.provider_id<>'google' or connection.external_account_id<>account.email then
        raise exception 'calendar_account_unavailable';
    end if;
    if not account.granted_scopes && array['calendar.events','calendar'] then
        raise exception 'calendar_permission_required';
    end if;
end;$$;
revoke all on function public.assert_calendar_action_account(uuid,jsonb) from public,anon,authenticated;

create function public.propose_calendar_action(p_user_id uuid,p_payload jsonb,p_payload_hash text,p_idempotency_key uuid)
returns public.action_requests language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;
begin
    perform pg_advisory_xact_lock(hashtextextended(concat('calendar-actions:',p_user_id),0));
    select * into request from public.action_requests where user_id=p_user_id
        and idempotency_key=concat('calendar:',p_idempotency_key);
    if found then
        if request.payload is distinct from p_payload or request.payload_hash is distinct from p_payload_hash
            then raise exception 'calendar_idempotency_conflict'; end if;
        return request;
    end if;
    perform public.assert_calendar_action_account(p_user_id,p_payload);
    if p_payload_hash is null or p_payload_hash!~'^[a-f0-9]{64}$' then raise exception 'calendar_payload_invalid'; end if;
    if (select count(*) from public.action_requests where user_id=p_user_id and action_id='calendar.create_event'
        and requested_at>now()-interval '1 minute')>=5 then raise exception 'calendar_rate_limited'; end if;
    insert into public.action_requests(user_id,action_id,payload,payload_hash,payload_version,idempotency_key,
        approval_state,status,policy_version,permission_snapshot_hash,expires_at)
    values(p_user_id,'calendar.create_event',p_payload,p_payload_hash,1,concat('calendar:',p_idempotency_key),
        'required','pending','calendar-actions-v1','pending',now()+interval '1 hour') returning * into request;
    return request;
end;$$;
revoke all on function public.propose_calendar_action(uuid,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.propose_calendar_action(uuid,jsonb,text,uuid) to service_role;

create function public.approve_calendar_action(p_request_id uuid,p_payload jsonb,p_payload_hash text,
    p_payload_version integer,p_decision text) returns public.action_requests
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;
begin
    select * into request from public.action_requests where id=p_request_id and user_id=auth.uid() for update;
    if not found then raise exception 'calendar_action_forbidden'; end if;
    if p_decision not in ('approved','denied') or request.action_id<>'calendar.create_event'
       or request.payload is distinct from p_payload or request.payload_hash is distinct from p_payload_hash
       or request.payload_version is distinct from p_payload_version or request.automation_run_id is not null
       or request.expires_at<=now() then raise exception 'calendar_action_stale_approval'; end if;
    if request.approval_state=p_decision then return request; end if;
    if request.approval_state<>'required' or request.status<>'pending' then raise exception 'calendar_action_already_decided'; end if;
    if p_decision='approved' then perform public.assert_calendar_action_account(request.user_id,p_payload); end if;
    update public.action_requests set approval_state=p_decision,
        status=case when p_decision='approved' then 'queued' else 'cancelled' end,
        approved_payload=case when p_decision='approved' then p_payload end,
        approved_payload_hash=case when p_decision='approved' then p_payload_hash end,
        approved_payload_version=case when p_decision='approved' then p_payload_version end,
        approved_at=case when p_decision='approved' then now() end,
        permission_snapshot_hash=case when p_decision='approved' then concat('calendar-explicit:',request.id,':',p_payload_hash) else permission_snapshot_hash end,
        denied_at=case when p_decision='denied' then now() end,decided_at=now(),state_version=state_version+1
    where id=request.id returning * into request;return request;
end;$$;
revoke all on function public.approve_calendar_action(uuid,jsonb,text,integer,text) from public,anon;
grant execute on function public.approve_calendar_action(uuid,jsonb,text,integer,text) to authenticated;

create function public.claim_calendar_action(p_request_id uuid,p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.calendar_action_dispatches%rowtype;inserted_count integer;
begin
    select * into request from public.action_requests where id=p_request_id for update;
    if not found or request.action_id<>'calendar.create_event' or request.approval_state<>'approved'
       or request.status='cancelled' or request.approved_payload is distinct from request.payload
       or request.approved_payload_hash is distinct from request.payload_hash
       or request.approved_payload_version is distinct from request.payload_version
       or request.permission_snapshot_hash is distinct from concat('calendar-explicit:',request.id,':',request.payload_hash)
       or request.automation_run_id is not null
       or (request.expires_at<=now() and not exists(select 1 from public.calendar_action_dispatches where action_request_id=request.id))
       or not exists(select 1 from public.jobs where id=p_job_id and user_id=request.user_id
          and type='action.execute' and metadata->'task'->>'actionRequestId'=request.id::text)
       then raise exception 'calendar_action_stale_approval'; end if;
    perform public.assert_calendar_action_account(request.user_id,request.payload);
    insert into public.calendar_action_dispatches(action_request_id,user_id,account_id,payload_hash)
    values(request.id,request.user_id,(request.payload->>'accountId')::uuid,request.payload_hash)
    on conflict(action_request_id) do nothing;get diagnostics inserted_count=row_count;
    if inserted_count=1 then update public.action_requests set status='running',execution_started_at=now() where id=request.id; end if;
    select * into dispatch from public.calendar_action_dispatches where action_request_id=request.id;
    if dispatch.payload_hash is distinct from request.payload_hash then raise exception 'calendar_dispatch_conflict'; end if;
    return jsonb_build_object('dispatchAllowed',inserted_count=1,'state',dispatch.state,
        'providerObjectId',dispatch.provider_object_id,'receipt',dispatch.receipt);
end;$$;
revoke all on function public.claim_calendar_action(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_calendar_action(uuid,uuid) to service_role;
