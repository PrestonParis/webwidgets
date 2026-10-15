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

revoke all on function public.trigger_v1_task_automation(uuid,text,boolean,uuid) from public,anon;
grant execute on function public.trigger_v1_task_automation(uuid,text,boolean,uuid) to authenticated,service_role;
