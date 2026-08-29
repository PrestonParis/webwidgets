-- Provider writes are not transactional with Postgres. Reserve each external
-- operation once; retries may reconcile it, but must never blindly re-dispatch.
create table public.email_action_dispatches (
    action_request_id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    -- Keep the approved identity after disconnect deletes its credential row.
    account_id uuid not null,
    action_id text not null check (action_id in ('email.draft', 'email.send')),
    payload_hash text not null,
    state text not null default 'reserved'
        check (state in ('reserved', 'prepared', 'dispatching', 'unknown', 'failed', 'verified')),
    provider_object_id text,
    receipt jsonb,
    reserved_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foreign key (action_request_id, user_id)
        references public.action_requests(id, user_id) on delete cascade
);
alter table public.email_action_dispatches enable row level security;
revoke all on public.email_action_dispatches from public, anon, authenticated;
grant select on public.email_action_dispatches to authenticated;
grant all on public.email_action_dispatches to service_role;
create policy email_dispatch_owner_read on public.email_action_dispatches
    for select to authenticated using (user_id = auth.uid());

-- Shared only by the authenticated approval RPC and the service-only claim.
create function public.assert_email_action_account(
    p_user_id uuid, p_action_id text, p_payload jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
    account public.user_email_accounts%rowtype;
    connection public.integration_connections%rowtype;
    scopes text[];
begin
    if p_action_id not in ('email.draft', 'email.send') then
        raise exception 'email_action_unsupported';
    end if;
    select * into account from public.user_email_accounts
    where id = (p_payload->>'accountId')::uuid and user_id = p_user_id;
    if not found then raise exception 'email_account_forbidden'; end if;
    select * into connection from public.integration_connections
    where id = account.integration_connection_id and user_id = p_user_id;
    if not found or connection.disabled_at is not null
       or connection.disconnected_at is not null
       or account.provider_subject is null
       or account.provider is distinct from p_payload->>'provider'
       or account.email is distinct from p_payload->>'from'
       or connection.provider_id is distinct from account.provider
       or connection.external_account_id is distinct from account.email then
        raise exception 'email_account_unavailable';
    end if;
    scopes := account.granted_scopes;
    if account.provider = 'google' then
        if not scopes && array['gmail.readonly','gmail.modify','https://mail.google.com/']
           or (p_action_id = 'email.draft' and not scopes &&
               array['gmail.compose','gmail.modify','https://mail.google.com/'])
           or (p_action_id = 'email.send' and not scopes &&
               array['gmail.send','gmail.compose','gmail.modify','https://mail.google.com/']) then
            raise exception 'email_permission_upgrade_required';
        end if;
    elsif account.provider = 'microsoft' then
        if not 'Mail.ReadWrite' = any(scopes)
           or (p_action_id = 'email.send' and not 'Mail.Send' = any(scopes)) then
            raise exception 'email_permission_upgrade_required';
        end if;
    else
        raise exception 'email_provider_unsupported';
    end if;
end;
$$;
revoke all on function public.assert_email_action_account(uuid,text,jsonb)
    from public, anon, authenticated;

create function public.approve_email_action(
    p_request_id uuid, p_action_id text, p_payload jsonb,
    p_payload_hash text, p_payload_version integer, p_decision text
) returns public.action_requests
language plpgsql security definer set search_path = '' as $$
declare
    request public.action_requests%rowtype;
begin
    select * into request from public.action_requests
    where id = p_request_id and user_id = auth.uid() for update;
    if not found then raise exception 'email_action_forbidden'; end if;
    if p_decision not in ('approved','denied')
       or p_action_id not in ('email.draft','email.send')
       or request.action_id is distinct from p_action_id
       or request.payload is distinct from p_payload
       or request.payload_hash is distinct from p_payload_hash
       or request.payload_version is distinct from p_payload_version
       or request.automation_run_id is not null
       or request.expires_at <= now() then
        raise exception 'email_action_stale_approval';
    end if;
    if request.approval_state = p_decision then return request; end if;
    if request.approval_state <> 'required' or request.status <> 'pending' then
        raise exception 'email_action_already_decided';
    end if;
    if p_decision = 'approved' then
        perform public.assert_email_action_account(request.user_id, p_action_id, p_payload);
    end if;
    update public.action_requests set
        approval_state = p_decision,
        status = case when p_decision = 'approved' then 'queued' else 'cancelled' end,
        approved_payload = case when p_decision = 'approved' then p_payload end,
        approved_payload_hash = case when p_decision = 'approved' then p_payload_hash end,
        approved_payload_version = case when p_decision = 'approved' then p_payload_version end,
        approved_at = case when p_decision = 'approved' then now() end,
        permission_snapshot_hash = case when p_decision = 'approved'
            then concat('email-explicit:',request.id,':',p_payload_hash)
            else permission_snapshot_hash end,
        denied_at = case when p_decision = 'denied' then now() end,
        decided_at = now(), state_version = state_version + 1
    where id = request.id returning * into request;
    return request;
end;
$$;
revoke all on function public.approve_email_action(uuid,text,jsonb,text,integer,text)
    from public, anon;
grant execute on function public.approve_email_action(uuid,text,jsonb,text,integer,text)
    to authenticated;

create function public.claim_email_action(p_request_id uuid, p_job_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    request public.action_requests%rowtype;
    dispatch public.email_action_dispatches%rowtype;
    inserted_count integer;
begin
    select * into request from public.action_requests where id = p_request_id for update;
    if not found then raise exception 'email_action_forbidden'; end if;
    if request.action_id not in ('email.draft','email.send')
       or request.approval_state <> 'approved'
       or request.status = 'cancelled'
       or request.approved_payload is distinct from request.payload
       or request.approved_payload_hash is distinct from request.payload_hash
       or request.approved_payload_version is distinct from request.payload_version
       or request.permission_snapshot_hash is distinct from
           concat('email-explicit:',request.id,':',request.payload_hash)
       or request.automation_run_id is not null
       or (request.expires_at <= now() and not exists (
           select 1 from public.email_action_dispatches where action_request_id=request.id))
       or not exists (select 1 from public.jobs j where j.id = p_job_id
           and j.user_id = request.user_id and j.type = 'action.execute'
           and j.metadata->'task'->>'actionRequestId' = request.id::text) then
        raise exception 'email_action_stale_approval';
    end if;
    perform public.assert_email_action_account(request.user_id, request.action_id, request.payload);
    insert into public.email_action_dispatches (
        action_request_id,user_id,account_id,action_id,payload_hash
    ) values (
        request.id,request.user_id,(request.payload->>'accountId')::uuid,
        request.action_id,request.payload_hash
    ) on conflict (action_request_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count=1 then
        update public.action_requests set status='running',execution_started_at=now()
        where id=request.id;
    end if;
    select * into dispatch from public.email_action_dispatches
    where action_request_id = request.id;
    if dispatch.payload_hash is distinct from request.payload_hash
       or dispatch.action_id is distinct from request.action_id
       or dispatch.account_id is distinct from (request.payload->>'accountId')::uuid then
        raise exception 'email_dispatch_conflict';
    end if;
    return jsonb_build_object(
        'dispatchAllowed', inserted_count = 1,
        'state', dispatch.state,
        'providerObjectId', dispatch.provider_object_id,
        'receipt', dispatch.receipt
    );
end;
$$;
revoke all on function public.claim_email_action(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_email_action(uuid,uuid) to service_role;

create function public.checkpoint_email_action(
    p_request_id uuid, p_job_id uuid, p_state text, p_provider_object_id text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
    if p_state not in ('prepared','dispatching') or p_provider_object_id is null then
        raise exception 'email_checkpoint_invalid';
    end if;
    update public.email_action_dispatches as dispatch set
        state=p_state,provider_object_id=p_provider_object_id,updated_at=now()
    from public.action_requests as request
    where dispatch.action_request_id=p_request_id and request.id=dispatch.action_request_id
      and dispatch.state not in ('verified','failed')
      and exists(select 1 from public.jobs where id=p_job_id and user_id=request.user_id
          and metadata->'task'->>'actionRequestId'=request.id::text);
    if not found then raise exception 'email_checkpoint_forbidden'; end if;
end;
$$;
revoke all on function public.checkpoint_email_action(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.checkpoint_email_action(uuid,uuid,text,text) to service_role;
