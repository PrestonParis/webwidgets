-- Four immutable, bounded V1 automation templates on the canonical run ledger.

create unique index if not exists automation_configs_v1_template_unique
    on public.automation_configs(user_id, definition_id)
    where definition_id in (
        'v1.commitment-capture', 'v1.daily-briefing',
        'v1.calendar-preparation', 'v1.stale-task-review'
    ) and archived_at is null;

create or replace function public.create_v1_automation_template(
    p_definition_id text,
    p_local_time time default '09:00',
    p_timezone text default 'UTC',
    p_approval_mode text default 'always',
    p_dry_run boolean default true
) returns public.automation_configs
language plpgsql security definer set search_path = '' as $$
declare
    config public.automation_configs%rowtype;
    template_name text;
    trigger_kind text;
    action_kind text;
    scheduled boolean;
    safe_approval text;
begin
    if auth.uid() is null then raise exception 'automation_unauthorized'; end if;
    if p_definition_id not in ('v1.commitment-capture','v1.daily-briefing',
        'v1.calendar-preparation','v1.stale-task-review') then
        raise exception 'automation_template_unsupported';
    end if;
    if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then
        raise exception 'automation_timezone_invalid';
    end if;
    scheduled := p_definition_id in ('v1.daily-briefing','v1.stale-task-review');
    safe_approval := case when p_definition_id in ('v1.daily-briefing','v1.stale-task-review')
        then 'never' else 'always' end;
    if p_approval_mode <> safe_approval then raise exception 'automation_approval_unsafe'; end if;
    template_name := case p_definition_id
        when 'v1.commitment-capture' then 'Commitment capture'
        when 'v1.daily-briefing' then 'Daily briefing'
        when 'v1.calendar-preparation' then 'Calendar preparation'
        else 'Stale-task review' end;
    trigger_kind := case when scheduled then 'schedule' else 'activity_event' end;
    action_kind := case p_definition_id
        when 'v1.commitment-capture' then 'create_task'
        when 'v1.daily-briefing' then 'summarize'
        when 'v1.calendar-preparation' then 'create_calendar_event'
        else 'request_review' end;
    insert into public.automation_configs(
        user_id,name,definition_id,version,trigger_type,condition_types,action_types,
        state,requires_approval,approval_mode,schedule,config,next_run_at,
        rate_limit_per_hour,cost_budget_cents
    ) values(
        auth.uid(),template_name,p_definition_id,1,trigger_kind,
        array['eligible_input','deduplicated'],array[action_kind],
        case when p_dry_run then 'dry_run' else 'draft' end,
        safe_approval='always',safe_approval,
        case when scheduled then p_local_time::text else null end,
        jsonb_build_object(
            'templateVersion',1,
            'schedule',jsonb_build_object('localTime',p_local_time,'timezone',p_timezone,
                'frequency',case when p_definition_id='v1.stale-task-review' then 'weekly' else 'daily' end),
            'policy',jsonb_build_object('approvalMode',safe_approval,'dryRunDefault',p_dry_run,
                'rateLimitPerHour',case when scheduled then 2 else 10 end,
                'costBudgetCents',case when p_definition_id='v1.daily-briefing' then 25 else 0 end)
        ),
        null,
        case when scheduled then 2 else 10 end,
        case when p_definition_id='v1.daily-briefing' then 25 else 0 end
    ) on conflict (user_id,definition_id) where definition_id in (
        'v1.commitment-capture','v1.daily-briefing','v1.calendar-preparation','v1.stale-task-review'
    ) and archived_at is null do update set updated_at=now()
    returning * into config;
    return config;
end; $$;

create or replace function public.trigger_v1_automation_template(
    p_config_id uuid,
    p_trigger_key text,
    p_trigger_payload jsonb default '{}'::jsonb,
    p_dry_run boolean default false,
    p_service_user_id uuid default null
) returns public.automation_runs
language plpgsql security definer set search_path = '' as $$
declare
    config public.automation_configs%rowtype;
    run public.automation_runs%rowtype;
    candidate public.candidate_actions%rowtype;
    request public.action_requests%rowtype;
    owner uuid := coalesce(auth.uid(),p_service_user_id);
    action_id text;
    v_action_payload jsonb := '{}'::jsonb;
    payload_hash text;
    paused boolean;
    due_count integer;
    inactive_count integer;
    covered_from timestamptz;
    covered_to timestamptz;
begin
    if owner is null or length(p_trigger_key) not between 1 and 500 then
        raise exception 'automation_trigger_invalid';
    end if;
    select * into config from public.automation_configs
      where id=p_config_id and user_id=owner and archived_at is null for update;
    if not found then raise exception 'automation_config_forbidden'; end if;
    if config.definition_id not in ('v1.commitment-capture','v1.daily-briefing',
        'v1.calendar-preparation','v1.stale-task-review') or config.version<>1 then
        raise exception 'automation_template_invalid';
    end if;
    select pause_all into paused from public.automation_user_controls where user_id=owner;

    if config.definition_id in ('v1.commitment-capture','v1.calendar-preparation') then
        if p_trigger_payload ? 'candidateId' then
            select * into candidate from public.candidate_actions
              where id=(p_trigger_payload->>'candidateId')::uuid and user_id=owner
              and expires_at>now() for update;
        else
            select * into candidate from public.candidate_actions
              where user_id=owner and expires_at>now()
              and ((config.definition_id='v1.commitment-capture' and candidate_kind='task'
                    and action_id='tasks.create' and state in ('proposed','edited'))
                or (config.definition_id='v1.calendar-preparation' and candidate_kind='calendar'
                    and action_id='calendar.create_event' and state='approved'))
              order by created_at limit 1 for update skip locked;
        end if;
        if not found then
            v_action_payload='{}'::jsonb;
        else
            v_action_payload=candidate.payload;
            action_id=candidate.action_id;
        end if;
        if config.definition_id='v1.calendar-preparation' and found then
            if candidate.state<>'approved' or v_action_payload->>'startsAt' is null
               or v_action_payload->>'endsAt' is null
               or (v_action_payload->>'startsAt')::timestamptz >= (v_action_payload->>'endsAt')::timestamptz then
                raise exception 'automation_calendar_time_ambiguous';
            end if;
            perform public.assert_calendar_action_account(owner,v_action_payload);
        end if;
    elsif config.definition_id='v1.daily-briefing' then
        covered_to:=coalesce((p_trigger_payload->>'coveredTo')::timestamptz,now());
        covered_from:=coalesce((p_trigger_payload->>'coveredFrom')::timestamptz,covered_to-interval '24 hours');
        if covered_from>=covered_to then raise exception 'automation_briefing_window_invalid'; end if;
        v_action_payload=jsonb_build_object('coveredFrom',covered_from,'coveredTo',covered_to,'trigger','daily');
    else
        select count(*) into due_count from public.todos
          where user_id=owner and completed=false and due_at<now();
        select count(*) into inactive_count from public.todos
          where user_id=owner and completed=false and updated_at<now()-interval '14 days';
        v_action_payload=jsonb_build_object('overdueCount',due_count,'inactiveCount',inactive_count,
            'reviewOnly',true);
    end if;
    payload_hash:=md5(v_action_payload::text);
    insert into public.automation_runs(user_id,automation_config_id,status,idempotency_key,
        trigger_key,trigger_payload,action_payload,action_payload_hash,action_payload_version,
        evaluation,dry_run,policy_version,started_at)
    values(owner,config.id,'evaluating',concat('automation:',config.id,':',p_trigger_key),
        p_trigger_key,p_trigger_payload,v_action_payload,payload_hash,config.version,'{}'::jsonb,
        p_dry_run or config.state='dry_run','bounded-templates-v1',now())
    on conflict (user_id,automation_config_id,trigger_key) where trigger_key is not null
      do update set updated_at=public.automation_runs.updated_at returning * into run;
    if run.status<>'evaluating' then return run; end if;
    if coalesce(paused,false) or (config.state not in ('enabled','dry_run')
       and not (p_dry_run and config.state='draft')) then
        update public.automation_runs set status='skipped',completed_at=now(),
          evaluation=jsonb_build_object('matched',false,'reason',case when paused then 'pause_all' else 'config_not_enabled' end)
          where id=run.id returning * into run; return run;
    end if;
    if (select count(*) from public.automation_runs where user_id=owner
        and automation_config_id=config.id and created_at>now()-interval '1 hour')>config.rate_limit_per_hour then
        update public.automation_runs set status='skipped',completed_at=now(),
          evaluation=jsonb_build_object('matched',false,'reason','rate_limited')
          where id=run.id returning * into run; return run;
    end if;
    if v_action_payload='{}'::jsonb then
        update public.automation_runs set status='skipped',completed_at=now(),
          evaluation=jsonb_build_object('matched',false,'reason','no_eligible_input')
          where id=run.id returning * into run; return run;
    end if;
    if run.dry_run then
        update public.automation_runs set status='completed',completed_at=now(),
          evaluation=jsonb_build_object('matched',true,'dryRun',true,'wouldExecute',v_action_payload)
          where id=run.id returning * into run; return run;
    end if;
    if config.definition_id='v1.stale-task-review' then
        update public.automation_runs set status='completed',completed_at=now(),result=v_action_payload,
          evaluation=jsonb_build_object('matched',true,'readOnly',true,'reason','tasks_surfaced_for_review')
          where id=run.id returning * into run;
    elsif config.definition_id='v1.daily-briefing' then
        update public.automation_runs set status='queued',evaluation=jsonb_build_object(
          'matched',true,'reason','briefing_queued') where id=run.id returning * into run;
    else
        update public.automation_runs set status='awaiting_approval',approval_state='pending',
          evaluation=jsonb_build_object('matched',true,'approvalRequired',true,
            'candidateId',candidate.id) where id=run.id returning * into run;
        insert into public.action_requests(user_id,automation_run_id,
          idempotency_key,action_id,payload,payload_hash,payload_version,approval_state,status,
          policy_version,permission_snapshot_hash,requested_at,expires_at)
        values(owner,run.id,concat('automation-action:',run.id),action_id,
          v_action_payload,payload_hash,config.version,'required','pending','bounded-templates-v1',
          concat('pending:',run.id,':v',config.version),now(),least(candidate.expires_at,now()+interval '24 hours'))
        on conflict (user_id,idempotency_key) where idempotency_key is not null do nothing
        returning * into request;
    end if;
    update public.automation_configs set last_triggered_at=now(),updated_at=now() where id=config.id;
    return run;
end; $$;

-- The exact approved payload can dispatch through its existing provider guard.
create or replace function public.decide_v1_automation_run(
    p_run_id uuid,p_expected_version integer,p_expected_hash text,p_decision text
) returns public.action_requests
language plpgsql security definer set search_path = '' as $$
declare run public.automation_runs%rowtype; request public.action_requests%rowtype; paused boolean; config_state text;
begin
    select * into run from public.automation_runs where id=p_run_id and user_id=auth.uid() for update;
    if not found then raise exception 'automation_run_forbidden'; end if;
    select * into request from public.action_requests where automation_run_id=run.id and user_id=run.user_id for update;
    if not found or p_decision not in ('approved','denied') then raise exception 'automation_approval_invalid'; end if;
    if request.expires_at<=now() then
        update public.automation_runs set approval_state='expired',status='cancelled',completed_at=now() where id=run.id;
        update public.action_requests set status='cancelled',failure_code='approval_expired' where id=request.id;
        select * into request from public.action_requests where id=request.id; return request;
    end if;
    if run.status not in ('awaiting_approval','waiting_for_approval') or run.approval_state<>'pending'
       or request.payload_version<>p_expected_version or request.payload_hash<>p_expected_hash
       or run.action_payload_version<>p_expected_version or run.action_payload_hash<>p_expected_hash then
        raise exception 'automation_approval_stale';
    end if;
    select pause_all into paused from public.automation_user_controls where user_id=run.user_id;
    select state into config_state from public.automation_configs where id=run.automation_config_id
      and user_id=run.user_id and archived_at is null;
    if p_decision='approved' and (coalesce(paused,false) or config_state<>'enabled') then
        raise exception 'automation_paused';
    end if;
    if p_decision='approved' and request.action_id='calendar.create_event' then
        perform public.assert_calendar_action_account(request.user_id,request.payload);
    end if;
    update public.action_requests set approval_state=p_decision,
      status=case when p_decision='approved' then 'queued' else 'cancelled' end,
      approved_payload=case when p_decision='approved' then payload end,
      approved_payload_hash=case when p_decision='approved' then payload_hash end,
      approved_payload_version=case when p_decision='approved' then payload_version end,
      approved_at=case when p_decision='approved' then now() end,
      denied_at=case when p_decision='denied' then now() end,decided_at=now(),
      permission_snapshot_hash=case when p_decision<>'approved' then permission_snapshot_hash
        when action_id='calendar.create_event' then concat('calendar-explicit:',id,':',payload_hash)
        else concat('automation-explicit:',id,':',payload_hash) end,state_version=state_version+1
      where id=request.id returning * into request;
    update public.automation_runs set approval_state=p_decision,
      status=case when p_decision='approved' then 'queued' else 'cancelled' end,
      completed_at=case when p_decision='denied' then now() end,state_version=state_version+1
      where id=run.id;
    return request;
end; $$;

create or replace function public.roll_up_automation_job() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if new.status='completed' then
        update public.automation_runs set status='completed',completed_at=coalesce(new.completed_at,now()),
          result=jsonb_build_object('jobId',new.id,'status','completed'),updated_at=now()
          where job_id=new.id and status not in ('completed','cancelled');
    elsif new.status in ('failed','dead_lettered') then
        update public.automation_runs set status=case when new.status='dead_lettered' then 'dead_lettered' else 'failed' end,
          completed_at=coalesce(new.completed_at,new.dead_lettered_at,now()),failure_code=new.failure_code,
          failure_detail=new.failure_detail,updated_at=now() where job_id=new.id and status not in ('completed','cancelled');
    elsif new.status='running' then
        update public.automation_runs set status='running',updated_at=now() where job_id=new.id and status='queued';
    end if;
    return new;
end; $$;

drop trigger if exists jobs_automation_rollup on public.jobs;
create trigger jobs_automation_rollup after update of status on public.jobs
for each row execute function public.roll_up_automation_job();

revoke all on function public.create_v1_automation_template(text,time,text,text,boolean) from public,anon;
grant execute on function public.create_v1_automation_template(text,time,text,text,boolean) to authenticated;
revoke all on function public.trigger_v1_automation_template(uuid,text,jsonb,boolean,uuid) from public,anon;
grant execute on function public.trigger_v1_automation_template(uuid,text,jsonb,boolean,uuid) to authenticated,service_role;
revoke all on function public.roll_up_automation_job() from public,anon,authenticated;
