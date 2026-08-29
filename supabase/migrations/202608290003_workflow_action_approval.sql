create table public.workflow_action_dispatches(
    action_request_id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
    automation_run_id uuid not null,workflow_key text not null,payload_hash text not null,
    state text not null default 'reserved' check(state in ('reserved','accepted','unknown','failed','completed')),
    provider_object_id text,receipt jsonb,reserved_at timestamptz not null default now(),updated_at timestamptz not null default now(),
    foreign key(action_request_id,user_id) references public.action_requests(id,user_id) on delete cascade,
    foreign key(automation_run_id,user_id) references public.automation_runs(id,user_id) on delete cascade
);
create table public.workflow_action_callbacks(
    callback_id text primary key,action_request_id uuid not null,user_id uuid not null,received_at timestamptz not null default now(),
    foreign key(action_request_id,user_id) references public.action_requests(id,user_id) on delete cascade
);
alter table public.workflow_action_dispatches enable row level security;
alter table public.workflow_action_callbacks enable row level security;
revoke all on public.workflow_action_dispatches,public.workflow_action_callbacks from public,anon,authenticated;
grant select on public.workflow_action_dispatches to authenticated;
grant all on public.workflow_action_dispatches,public.workflow_action_callbacks to service_role;
create policy workflow_dispatch_owner_read on public.workflow_action_dispatches for select to authenticated using(user_id=auth.uid());

create function public.assert_workflow_action_config(p_user_id uuid,p_payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare config public.automation_configs%rowtype;
begin
    select * into config from public.automation_configs where id=(p_payload->>'automationConfigId')::uuid
        and user_id=p_user_id;
    if not found then raise exception 'workflow_config_forbidden'; end if;
    if config.state<>'enabled' or config.config->>'workflowKey' is distinct from p_payload->>'workflowKey'
       then raise exception 'workflow_config_unavailable'; end if;
    if exists(select 1 from unnest(config.consent_requirements) as required(scope)
        where not exists(select 1 from public.consent_records where user_id=p_user_id
            and consent_records.scope=required.scope and state='granted'))
       then raise exception 'workflow_consent_required'; end if;
    return config.id;
end;$$;
revoke all on function public.assert_workflow_action_config(uuid,jsonb) from public,anon,authenticated;

create function public.propose_workflow_action(p_user_id uuid,p_payload jsonb,p_payload_hash text,p_idempotency_key uuid)
returns public.action_requests language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;run public.automation_runs%rowtype;config_id uuid;
begin
    perform pg_advisory_xact_lock(hashtextextended(concat('workflow-actions:',p_user_id),0));
    select * into request from public.action_requests where user_id=p_user_id and idempotency_key=concat('workflow:',p_idempotency_key);
    if found then
        if request.payload is distinct from p_payload or request.payload_hash is distinct from p_payload_hash
            then raise exception 'workflow_idempotency_conflict'; end if;return request;
    end if;
    config_id:=public.assert_workflow_action_config(p_user_id,p_payload);
    if p_payload_hash is null or p_payload_hash!~'^[a-f0-9]{64}$' then raise exception 'workflow_payload_invalid'; end if;
    if (select count(*) from public.action_requests where user_id=p_user_id and action_id='automation.run'
        and requested_at>now()-interval '1 minute')>=5 then raise exception 'workflow_rate_limited'; end if;
    insert into public.automation_runs(user_id,automation_config_id,idempotency_key,policy_version,status)
    values(p_user_id,config_id,concat('workflow:',p_idempotency_key),'workflow-actions-v1','waiting_for_approval') returning * into run;
    insert into public.action_requests(user_id,action_id,payload,payload_hash,payload_version,idempotency_key,
        approval_state,status,policy_version,permission_snapshot_hash,expires_at,automation_run_id)
    values(p_user_id,'automation.run',p_payload,p_payload_hash,1,concat('workflow:',p_idempotency_key),
        'required','pending','workflow-actions-v1','pending',now()+interval '1 hour',run.id) returning * into request;
    return request;
end;$$;
revoke all on function public.propose_workflow_action(uuid,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.propose_workflow_action(uuid,jsonb,text,uuid) to service_role;

create function public.approve_workflow_action(p_request_id uuid,p_payload jsonb,p_payload_hash text,p_payload_version integer,p_decision text)
returns public.action_requests language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;
begin
    select * into request from public.action_requests where id=p_request_id and user_id=auth.uid() for update;
    if not found then raise exception 'workflow_action_forbidden'; end if;
    if p_decision not in ('approved','denied') or request.action_id<>'automation.run'
       or request.payload is distinct from p_payload or request.payload_hash is distinct from p_payload_hash
       or request.payload_version is distinct from p_payload_version or request.automation_run_id is null
       or request.expires_at<=now() then raise exception 'workflow_action_stale_approval'; end if;
    if request.approval_state=p_decision then return request; end if;
    if request.approval_state<>'required' or request.status<>'pending' then raise exception 'workflow_action_already_decided'; end if;
    if p_decision='approved' then perform public.assert_workflow_action_config(request.user_id,p_payload); end if;
    update public.action_requests set approval_state=p_decision,status=case when p_decision='approved' then 'queued' else 'cancelled' end,
        approved_payload=case when p_decision='approved' then p_payload end,
        approved_payload_hash=case when p_decision='approved' then p_payload_hash end,
        approved_payload_version=case when p_decision='approved' then p_payload_version end,
        approved_at=case when p_decision='approved' then now() end,
        permission_snapshot_hash=case when p_decision='approved' then concat('workflow-explicit:',request.id,':',p_payload_hash) else permission_snapshot_hash end,
        denied_at=case when p_decision='denied' then now() end,decided_at=now(),state_version=state_version+1
    where id=request.id returning * into request;
    update public.automation_runs set status=case when p_decision='approved' then 'queued' else 'cancelled' end,
        updated_at=now() where id=request.automation_run_id and user_id=request.user_id;return request;
end;$$;
revoke all on function public.approve_workflow_action(uuid,jsonb,text,integer,text) from public,anon;
grant execute on function public.approve_workflow_action(uuid,jsonb,text,integer,text) to authenticated;
