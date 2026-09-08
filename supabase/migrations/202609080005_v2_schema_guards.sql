create function public.guard_objective_transition()
returns trigger language plpgsql set search_path = '' as $$
declare
    allowed boolean;
begin
    if tg_op = 'DELETE' then
        if old.status = 'draft'
           or pg_trigger_depth() > 1
           or (
               current_user in ('postgres', 'service_role')
               and coalesce(current_setting('app.v2_evidence_purge', true), 'off') = 'on'
           ) then
            return old;
        end if;
        raise exception 'non-draft objectives require the retention purge path';
    end if;
    if new.user_id <> old.user_id or new.id <> old.id then
        raise exception 'objective identity and owner are immutable';
    end if;
    if new.status = old.status then
        return new;
    end if;
    allowed := case old.status
        when 'draft' then new.status in ('submitted', 'cancelled')
        when 'submitted' then new.status in ('active', 'blocked', 'cancel_requested', 'failed')
        when 'active' then new.status in ('paused', 'blocked', 'cancel_requested', 'completed', 'failed')
        when 'paused' then new.status in ('active', 'blocked', 'cancel_requested', 'failed')
        when 'blocked' then new.status in ('active', 'paused', 'cancel_requested', 'failed')
        when 'cancel_requested' then new.status in ('cancelled', 'active', 'failed')
        when 'cancelled' then new.status = 'archived'
        when 'completed' then new.status = 'archived'
        when 'failed' then new.status = 'archived'
        else false
    end;
    if not allowed then
        raise exception 'invalid objective transition: % -> %', old.status, new.status;
    end if;
    if new.state_version <> old.state_version + 1 then
        raise exception 'objective state transition must increment state_version by one';
    end if;
    return new;
end;
$$;

create trigger objectives_guard_transition
    before update or delete on public.objectives
    for each row execute function public.guard_objective_transition();

create function public.guard_published_objective_version()
returns trigger language plpgsql set search_path = '' as $$
begin
    if tg_op = 'DELETE' and old.published_at is not null
       and not (
           current_user in ('postgres', 'service_role')
           and coalesce(current_setting('app.v2_evidence_purge', true), 'off') = 'on'
       )
       and pg_trigger_depth() <= 1 then
        raise exception 'published objective versions are immutable';
    end if;
    if tg_op = 'UPDATE' and old.published_at is not null
       and (to_jsonb(new) - 'superseded_at') <> (to_jsonb(old) - 'superseded_at') then
        raise exception 'published objective versions are immutable';
    end if;
    if tg_op = 'UPDATE' and old.published_at is not null
       and old.superseded_at is not null and new.superseded_at is distinct from old.superseded_at then
        raise exception 'objective version supersession is immutable';
    end if;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger objective_versions_guard_published
    before update or delete on public.objective_versions
    for each row execute function public.guard_published_objective_version();

create function public.guard_objective_plan()
returns trigger language plpgsql set search_path = '' as $$
begin
    if tg_op = 'DELETE' and old.status <> 'draft'
       and not (
           current_user in ('postgres', 'service_role')
           and coalesce(current_setting('app.v2_evidence_purge', true), 'off') = 'on'
       )
       and pg_trigger_depth() <= 1 then
        raise exception 'published objective plans are immutable';
    end if;
    if tg_op = 'UPDATE' then
        if old.status = 'published'
           and (to_jsonb(new) - array['status', 'superseded_at'])
               <> (to_jsonb(old) - array['status', 'superseded_at']) then
            raise exception 'published objective plan definitions are immutable';
        end if;
        if old.status = 'published' and new.status = 'published'
           and new.superseded_at is distinct from old.superseded_at then
            raise exception 'plan supersession requires the superseded state';
        end if;
        if not (
            new.status = old.status
            or (old.status = 'draft' and new.status in ('published', 'invalidated'))
            or (old.status = 'published' and new.status = 'superseded')
        ) then
            raise exception 'invalid objective plan transition: % -> %', old.status, new.status;
        end if;
    end if;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger objective_plans_guard_definition
    before update or delete on public.objective_plans
    for each row execute function public.guard_objective_plan();

create function public.guard_published_plan_child()
returns trigger language plpgsql set search_path = '' as $$
declare
    child_plan_id uuid := case when tg_op = 'DELETE' then old.plan_id else new.plan_id end;
begin
    if exists (
        select 1 from public.objective_plans
        where id = child_plan_id and status <> 'draft'
    ) and not (
        current_user in ('postgres', 'service_role')
        and coalesce(current_setting('app.v2_evidence_purge', true), 'off') = 'on'
    )
      and pg_trigger_depth() <= 1 then
        raise exception 'published objective plan children are immutable';
    end if;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger objective_plan_steps_guard_published
    before insert or update or delete on public.objective_plan_steps
    for each row execute function public.guard_published_plan_child();
create trigger objective_step_dependencies_guard_published
    before insert or update or delete on public.objective_step_dependencies
    for each row execute function public.guard_published_plan_child();

create function public.guard_append_only_v2_row()
returns trigger language plpgsql set search_path = '' as $$
begin
    if pg_trigger_depth() > 1 or (
        current_user in ('postgres', 'service_role')
        and coalesce(current_setting('app.v2_evidence_purge', true), 'off') = 'on'
    ) then
        return case when tg_op = 'DELETE' then old else new end;
    end if;
    raise exception '% rows are append-only', tg_table_name;
end;
$$;

create trigger objective_policy_decisions_append_only
    before update or delete on public.objective_policy_decisions
    for each row execute function public.guard_append_only_v2_row();
create trigger objective_step_results_append_only
    before update or delete on public.objective_step_results
    for each row execute function public.guard_append_only_v2_row();
create trigger objective_verification_results_append_only
    before update or delete on public.objective_verification_results
    for each row execute function public.guard_append_only_v2_row();
create trigger objective_execution_evidence_append_only
    before update or delete on public.objective_execution_evidence
    for each row execute function public.guard_append_only_v2_row();

create function public.guard_approval_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
    if old.status <> 'pending' or new.status not in ('approved', 'denied', 'expired', 'revoked') then
        raise exception 'invalid approval transition: % -> %', old.status, new.status;
    end if;
    if (to_jsonb(new) - array[
        'status', 'decided_by', 'decided_payload', 'decided_payload_hash',
        'decided_payload_version', 'decided_at'
    ]) <> (to_jsonb(old) - array[
        'status', 'decided_by', 'decided_payload', 'decided_payload_hash',
        'decided_payload_version', 'decided_at'
    ]) then
        raise exception 'approval request payload is immutable';
    end if;
    return new;
end;
$$;

create trigger objective_approvals_guard_transition
    before update on public.objective_approvals
    for each row execute function public.guard_approval_transition();
create trigger objective_approvals_guard_delete
    before delete on public.objective_approvals
    for each row execute function public.guard_append_only_v2_row();

create function public.guard_external_effect_transition()
returns trigger language plpgsql set search_path = '' as $$
declare
    allowed boolean;
begin
    if (to_jsonb(new) - array[
        'state', 'provider_execution_id', 'dispatched_at', 'accepted_at',
        'verified_at', 'last_error', 'updated_at'
    ]) <> (to_jsonb(old) - array[
        'state', 'provider_execution_id', 'dispatched_at', 'accepted_at',
        'verified_at', 'last_error', 'updated_at'
    ]) then
        raise exception 'external effect reservation identity is immutable';
    end if;
    allowed := new.state = old.state or case old.state
        when 'reserved' then new.state in ('dispatched', 'failed')
        when 'dispatched' then new.state in ('accepted', 'unknown', 'failed')
        when 'accepted' then new.state in ('verified', 'unknown', 'compensating', 'failed')
        when 'unknown' then new.state in ('accepted', 'verified', 'compensating', 'failed')
        when 'verified' then new.state = 'compensating'
        when 'compensating' then new.state in ('compensated', 'failed')
        else false
    end;
    if not allowed then
        raise exception 'invalid external effect transition: % -> %', old.state, new.state;
    end if;
    return new;
end;
$$;

create trigger objective_external_effects_guard_transition
    before update on public.objective_external_effects
    for each row execute function public.guard_external_effect_transition();
create trigger objective_external_effects_guard_delete
    before delete on public.objective_external_effects
    for each row execute function public.guard_append_only_v2_row();

create function public.guard_execution_transition()
returns trigger language plpgsql set search_path = '' as $$
declare
    allowed boolean;
begin
    if tg_table_name = 'objective_runs' then
        if (to_jsonb(new) - array[
            'status', 'ownership_epoch', 'lease_owner', 'lease_expires_at',
            'started_at', 'completed_at', 'cancellation_requested_at',
            'failure_code', 'failure_detail', 'updated_at'
        ]) <> (to_jsonb(old) - array[
            'status', 'ownership_epoch', 'lease_owner', 'lease_expires_at',
            'started_at', 'completed_at', 'cancellation_requested_at',
            'failure_code', 'failure_detail', 'updated_at'
        ]) then
            raise exception 'objective run identity is immutable';
        end if;
        allowed := new.status = old.status or case old.status
            when 'queued' then new.status in ('leased', 'cancel_requested', 'cancelled', 'failed')
            when 'leased' then new.status in ('queued', 'running', 'cancel_requested', 'failed')
            when 'running' then new.status in (
                'paused', 'blocked', 'cancel_requested', 'succeeded', 'failed'
            )
            when 'paused' then new.status in ('running', 'cancel_requested', 'failed')
            when 'blocked' then new.status in ('queued', 'running', 'cancel_requested', 'failed')
            when 'cancel_requested' then new.status in ('running', 'cancelled', 'failed')
            else false
        end;
    else
        if (to_jsonb(new) - array[
            'status', 'ownership_epoch', 'lease_owner', 'lease_expires_at',
            'started_at', 'completed_at', 'failure_code', 'updated_at'
        ]) <> (to_jsonb(old) - array[
            'status', 'ownership_epoch', 'lease_owner', 'lease_expires_at',
            'started_at', 'completed_at', 'failure_code', 'updated_at'
        ]) then
            raise exception 'objective step attempt identity is immutable';
        end if;
        allowed := new.status = old.status or case old.status
            when 'queued' then new.status in ('leased', 'cancelled')
            when 'leased' then new.status in ('queued', 'running', 'cancelled')
            when 'running' then new.status in ('succeeded', 'failed', 'cancelled')
            else false
        end;
    end if;
    if not allowed then
        raise exception 'invalid % transition: % -> %', tg_table_name, old.status, new.status;
    end if;
    if new.ownership_epoch < old.ownership_epoch
       or new.ownership_epoch > old.ownership_epoch + 1 then
        raise exception 'ownership_epoch must be monotonic and advance by at most one';
    end if;
    return new;
end;
$$;

create trigger objective_runs_guard_transition
    before update on public.objective_runs
    for each row execute function public.guard_execution_transition();
create trigger objective_step_attempts_guard_transition
    before update on public.objective_step_attempts
    for each row execute function public.guard_execution_transition();
