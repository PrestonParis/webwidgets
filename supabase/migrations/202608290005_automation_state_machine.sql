-- Durable V1 automation control plane. The only executable V1 fixture creates
-- a local task and always requires an immutable user approval.

alter table public.automation_configs
    add column if not exists definition_id text,
    add column if not exists version integer not null default 1,
    add column if not exists approval_mode text not null default 'always',
    add column if not exists archived_at timestamptz,
    add column if not exists next_run_at timestamptz,
    add column if not exists last_triggered_at timestamptz,
    add column if not exists rate_limit_per_hour integer not null default 5,
    add column if not exists cost_budget_cents integer not null default 0;

alter table public.automation_configs
    drop constraint if exists automation_configs_state_check,
    add constraint automation_configs_state_check check (
        state in ('draft', 'dry_run', 'enabled', 'paused', 'disabled',
                  'requires_connection', 'requires_consent')
    ) not valid,
    add constraint automation_configs_approval_mode_check check (
        approval_mode in ('always', 'never')
    ),
    add constraint automation_configs_v1_limits_check check (
        version > 0 and rate_limit_per_hour between 1 and 100
        and cost_budget_cents >= 0
    );

create index if not exists automation_configs_due_idx
    on public.automation_configs(next_run_at)
    where state = 'enabled' and archived_at is null and next_run_at is not null;

alter table public.automation_runs
    add column if not exists trigger_key text,
    add column if not exists trigger_payload jsonb not null default '{}'::jsonb,
    add column if not exists action_payload jsonb not null default '{}'::jsonb,
    add column if not exists action_payload_hash text,
    add column if not exists action_payload_version integer not null default 1,
    add column if not exists approval_state text,
    add column if not exists evaluation jsonb not null default '{}'::jsonb,
    add column if not exists dry_run boolean not null default false,
    add column if not exists state_version integer not null default 1,
    add column if not exists attempt integer not null default 0,
    add column if not exists max_attempts integer not null default 3;

alter table public.automation_runs
    drop constraint if exists automation_runs_status_check,
    add constraint automation_runs_status_check check (
        status in ('triggered', 'evaluating', 'skipped', 'awaiting_approval',
                   'waiting_for_approval', 'queued', 'running', 'completed',
                   'partially_failed', 'failed', 'dead_lettered', 'cancelled')
    ) not valid,
    add constraint automation_runs_approval_state_check check (
        approval_state is null or approval_state in
        ('pending', 'approved', 'denied', 'expired', 'invalidated')
    ) not valid;

create unique index if not exists automation_runs_trigger_key_unique
    on public.automation_runs(user_id, automation_config_id, trigger_key)
    where trigger_key is not null;

create table if not exists public.automation_user_controls (
    user_id uuid primary key references auth.users(id) on delete cascade,
    pause_all boolean not null default false,
    state_version integer not null default 1,
    updated_at timestamptz not null default now()
);

create table if not exists public.automation_suggestion_dismissals (
    user_id uuid not null references auth.users(id) on delete cascade,
    suggestion_id text not null,
    dismissed_at timestamptz not null default now(),
    primary key (user_id, suggestion_id)
);

create table if not exists public.automation_deliverables (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    source_widgets text[] not null default '{}',
    output_type text not null check (output_type in ('summary','report','digest','briefing','export')),
    schedule jsonb not null,
    delivery_destination text not null check (delivery_destination in
        ('dashboard_notification','inbox','email_draft','calendar_suggestion','download')),
    approval_mode text not null check (approval_mode in ('auto','review')),
    enabled boolean not null default false,
    last_generated_at timestamptz,
    next_generated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.automation_user_controls enable row level security;
alter table public.automation_suggestion_dismissals enable row level security;
alter table public.automation_deliverables enable row level security;

create policy automation_user_controls_own on public.automation_user_controls
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy automation_suggestion_dismissals_own on public.automation_suggestion_dismissals
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy automation_deliverables_own on public.automation_deliverables
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.create_v1_task_automation(
    p_name text,
    p_title text,
    p_notes text default null,
    p_schedule_time time default null,
    p_timezone text default 'UTC'
) returns public.automation_configs
language plpgsql security definer set search_path = '' as $$
declare config public.automation_configs%rowtype;
begin
    if auth.uid() is null then raise exception 'automation_unauthorized'; end if;
    if length(trim(p_name)) not between 1 and 120
       or length(trim(p_title)) not between 1 and 240
       or length(coalesce(p_notes, '')) > 4000
       or length(p_timezone) not between 1 and 100 then
        raise exception 'automation_config_invalid';
    end if;
    insert into public.automation_configs (
        user_id, name, definition_id, trigger_type, condition_types,
        action_types, state, requires_approval, approval_mode, schedule, config,
        next_run_at
    ) values (
        auth.uid(), trim(p_name), 'v1.create-task',
        case when p_schedule_time is null then 'manual' else 'schedule' end,
        array['always'], array['create_task'], 'draft', true, 'always',
        case when p_schedule_time is null then null else p_schedule_time::text end,
        jsonb_build_object(
            'trigger', jsonb_build_object('type', case when p_schedule_time is null then 'manual' else 'schedule' end,
                'time', p_schedule_time, 'timezone', p_timezone),
            'condition', jsonb_build_object('type', 'always'),
            'action', jsonb_strip_nulls(jsonb_build_object('actionId', 'tasks.create',
                'payload', jsonb_build_object('title', trim(p_title), 'notes', p_notes, 'dueAt', null))),
            'policy', jsonb_build_object('approvalMode', 'always', 'rateLimitPerHour', 5, 'costBudgetCents', 0)
        ),
        case when p_schedule_time is null then null else now() + interval '1 day' end
    ) returning * into config;
    return config;
end; $$;

create or replace function public.trigger_v1_task_automation(
    p_config_id uuid,
    p_trigger_key text,
    p_dry_run boolean default false,
    p_service_user_id uuid default null
) returns public.automation_runs
language plpgsql security definer set search_path = '' as $$
declare
    config public.automation_configs%rowtype;
    run public.automation_runs%rowtype;
    request public.action_requests%rowtype;
    owner uuid := coalesce(auth.uid(), p_service_user_id);
    v_action_payload jsonb;
    payload_hash text;
    globally_paused boolean;
begin
    if owner is null or length(p_trigger_key) not between 1 and 500 then
        raise exception 'automation_trigger_invalid';
    end if;
    select * into config from public.automation_configs
    where id = p_config_id and user_id = owner and archived_at is null for update;
    if not found then raise exception 'automation_config_forbidden'; end if;
    if config.definition_id <> 'v1.create-task'
       or config.config#>>'{condition,type}' <> 'always'
       or config.config#>>'{action,actionId}' <> 'tasks.create'
       or config.approval_mode <> 'always' then
        raise exception 'automation_config_invalid';
    end if;
    select pause_all into globally_paused from public.automation_user_controls where user_id = owner;
    v_action_payload := config.config#>'{action,payload}';
    payload_hash := md5(v_action_payload::text);

    insert into public.automation_runs (
        user_id, automation_config_id, status, idempotency_key, trigger_key,
        trigger_payload, action_payload, action_payload_hash,
        action_payload_version, approval_state, evaluation, dry_run,
        policy_version, started_at
    ) values (
        owner, config.id, 'evaluating', concat('automation:', config.id, ':', p_trigger_key),
        p_trigger_key, jsonb_build_object('type', config.trigger_type), v_action_payload,
        payload_hash, config.version, null, '{}'::jsonb, p_dry_run or config.state = 'dry_run',
        'automation-state-v1', now()
    ) on conflict (user_id, automation_config_id, trigger_key) where trigger_key is not null
      do update set updated_at = public.automation_runs.updated_at
    returning * into run;
    if run.status <> 'evaluating' then return run; end if;

    if coalesce(globally_paused, false)
       or (config.state not in ('enabled', 'dry_run') and not (p_dry_run and config.state = 'draft')) then
        update public.automation_runs set status = 'skipped', completed_at = now(), updated_at = now(),
            evaluation = jsonb_build_object('matched', false, 'reason',
                case when globally_paused then 'pause_all' else 'config_not_enabled' end)
        where id = run.id returning * into run;
        return run;
    end if;
    if (select count(*) from public.automation_runs where user_id = owner
        and automation_config_id = config.id and created_at > now() - interval '1 hour')
        > config.rate_limit_per_hour then
        update public.automation_runs set status = 'skipped', completed_at = now(), updated_at = now(),
            evaluation = jsonb_build_object('matched', false, 'reason', 'rate_limited')
        where id = run.id returning * into run;
        return run;
    end if;
    if run.dry_run then
        update public.automation_runs set status = 'completed', completed_at = now(), updated_at = now(),
            evaluation = jsonb_build_object('matched', true, 'dryRun', true, 'wouldExecute', v_action_payload)
        where id = run.id returning * into run;
        return run;
    end if;

    update public.automation_runs set status = 'awaiting_approval', approval_state = 'pending',
        evaluation = jsonb_build_object('matched', true, 'approvalRequired', true), updated_at = now()
    where id = run.id returning * into run;
    insert into public.action_requests (
        user_id, automation_run_id, idempotency_key, action_id, payload,
        payload_hash, payload_version, approval_state, status, policy_version,
        permission_snapshot_hash, requested_at, expires_at
    ) values (
        owner, run.id, concat('automation-action:', run.id), 'tasks.create', v_action_payload,
        payload_hash, config.version, 'required', 'pending', 'automation-state-v1',
        concat('pending:', run.id, ':v', config.version), now(), now() + interval '24 hours'
    ) on conflict (user_id, idempotency_key) where idempotency_key is not null do nothing
    returning * into request;
    update public.automation_configs set last_triggered_at = now(), updated_at = now() where id = config.id;
    return run;
end; $$;

create or replace function public.decide_v1_automation_run(
    p_run_id uuid,
    p_expected_version integer,
    p_expected_hash text,
    p_decision text
) returns public.action_requests
language plpgsql security definer set search_path = '' as $$
declare run public.automation_runs%rowtype; request public.action_requests%rowtype; paused boolean; config_state text;
begin
    select * into run from public.automation_runs where id = p_run_id and user_id = auth.uid() for update;
    if not found then raise exception 'automation_run_forbidden'; end if;
    select * into request from public.action_requests where automation_run_id = run.id and user_id = run.user_id for update;
    if not found or p_decision not in ('approved','denied') then raise exception 'automation_approval_invalid'; end if;
    if request.expires_at <= now() then
        update public.automation_runs set approval_state='expired', status='cancelled', completed_at=now(), updated_at=now() where id=run.id;
        update public.action_requests set status='cancelled', failure_code='approval_expired' where id=request.id;
        select * into request from public.action_requests where id=request.id;
        return request;
    end if;
    if run.status not in ('awaiting_approval','waiting_for_approval') or run.approval_state <> 'pending'
       or request.payload_version <> p_expected_version or request.payload_hash <> p_expected_hash
       or run.action_payload_version <> p_expected_version or run.action_payload_hash <> p_expected_hash then
        raise exception 'automation_approval_stale';
    end if;
    select pause_all into paused from public.automation_user_controls where user_id=run.user_id;
    select state into config_state from public.automation_configs
        where id=run.automation_config_id and user_id=run.user_id and archived_at is null;
    if p_decision='approved' and (coalesce(paused,false) or config_state <> 'enabled')
        then raise exception 'automation_paused'; end if;
    update public.action_requests set approval_state=p_decision,
        status=case when p_decision='approved' then 'queued' else 'cancelled' end,
        approved_payload=case when p_decision='approved' then payload end,
        approved_payload_hash=case when p_decision='approved' then payload_hash end,
        approved_payload_version=case when p_decision='approved' then payload_version end,
        approved_at=case when p_decision='approved' then now() end,
        denied_at=case when p_decision='denied' then now() end,
        decided_at=now(), permission_snapshot_hash=case when p_decision='approved'
            then concat('automation-explicit:',id,':',payload_hash) else permission_snapshot_hash end,
        state_version=state_version+1
    where id=request.id returning * into request;
    update public.automation_runs set approval_state=p_decision,
        status=case when p_decision='approved' then 'queued' else 'cancelled' end,
        completed_at=case when p_decision='denied' then now() end,
        state_version=state_version+1,updated_at=now() where id=run.id;
    return request;
end; $$;

create or replace function public.assert_v1_automation_execution(p_action_request_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare request public.action_requests%rowtype; config_state text; paused boolean;
begin
    select * into request from public.action_requests where id=p_action_request_id for update;
    if not found then raise exception 'automation_action_missing'; end if;
    if request.automation_run_id is null then return true; end if;
    select c.state into config_state from public.automation_runs r join public.automation_configs c
        on c.id=r.automation_config_id and c.user_id=r.user_id where r.id=request.automation_run_id;
    select pause_all into paused from public.automation_user_controls where user_id=request.user_id;
    if coalesce(paused,false) or config_state <> 'enabled' then
        update public.action_requests set status='cancelled',failure_code='automation_paused',
            failure_detail='Execution cancelled by automation pause control.' where id=request.id;
        update public.automation_runs set status='cancelled',completed_at=now(),updated_at=now()
            where id=request.automation_run_id;
        return false;
    end if;
    update public.automation_runs set status='running',started_at=coalesce(started_at,now()),updated_at=now()
        where id=request.automation_run_id and status='queued';
    return true;
end; $$;

create or replace function public.roll_up_v1_automation_run()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if new.automation_run_id is null then return new; end if;
    if new.status='completed' then
        update public.automation_runs set status='completed',completed_at=coalesce(new.execution_completed_at,now()),
            result=jsonb_build_object('actionRequestId',new.id,'status','completed'),updated_at=now()
        where id=new.automation_run_id and status not in ('completed','cancelled');
    elsif new.status='failed' then
        update public.automation_runs set status='dead_lettered',completed_at=coalesce(new.execution_completed_at,now()),
            failure_code=new.failure_code,failure_detail=new.failure_detail,updated_at=now()
        where id=new.automation_run_id and status not in ('completed','cancelled');
    end if;
    return new;
end; $$;

drop trigger if exists action_request_automation_rollup on public.action_requests;
create trigger action_request_automation_rollup after update of status on public.action_requests
for each row execute function public.roll_up_v1_automation_run();

revoke all on function public.create_v1_task_automation(text,text,text,time,text) from public,anon;
grant execute on function public.create_v1_task_automation(text,text,text,time,text) to authenticated;
revoke all on function public.trigger_v1_task_automation(uuid,text,boolean,uuid) from public,anon;
grant execute on function public.trigger_v1_task_automation(uuid,text,boolean,uuid) to authenticated,service_role;
revoke all on function public.decide_v1_automation_run(uuid,integer,text,text) from public,anon;
grant execute on function public.decide_v1_automation_run(uuid,integer,text,text) to authenticated;
revoke all on function public.assert_v1_automation_execution(uuid) from public,anon,authenticated;
grant execute on function public.assert_v1_automation_execution(uuid) to service_role;
revoke all on function public.roll_up_v1_automation_run() from public,anon,authenticated;
grant select,insert,update,delete on public.automation_user_controls,
    public.automation_suggestion_dismissals,public.automation_deliverables to authenticated;
