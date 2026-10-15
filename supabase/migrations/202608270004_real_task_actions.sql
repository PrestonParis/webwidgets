-- Execute approved task actions atomically and keep the product row as the
-- final idempotency boundary across HTTP, queue, and worker retries.

alter table public.todos
    add column if not exists notes text,
    add column if not exists source_action_request_id uuid;

alter table public.todos
    add constraint todos_source_action_request_owner_fk
        foreign key (source_action_request_id, user_id)
        references public.action_requests(id, user_id) on delete set null;

create unique index todos_source_action_request_unique
    on public.todos(source_action_request_id)
    where source_action_request_id is not null;

create unique index action_requests_candidate_version_unique
    on public.action_requests(candidate_action_id, payload_version)
    where candidate_action_id is not null;

alter table public.candidate_actions
    drop constraint if exists candidate_actions_approval_binding_check;
alter table public.candidate_actions
    add constraint candidate_actions_approval_binding_check check (
        (approved_payload_hash is null and approved_payload_version is null)
        or (
            approved_payload_hash = payload_hash
            and approved_payload_version = payload_version
            and state in ('approved', 'executing', 'completed', 'failed')
        )
    );

revoke insert, update, delete on table public.action_requests from authenticated;
revoke insert, update, delete on table public.action_results from authenticated;

create or replace function public.materialize_approved_task_action(
    p_candidate_id uuid,
    p_expected_version integer,
    p_expected_hash text
) returns public.action_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
    candidate public.candidate_actions%rowtype;
    request public.action_requests%rowtype;
    request_key text;
begin
    select * into candidate
    from public.candidate_actions
    where id = p_candidate_id and user_id = auth.uid()
    for update;
    if not found then raise exception 'task_action_forbidden'; end if;
    if candidate.candidate_kind <> 'task' or candidate.action_id <> 'tasks.create' then
        raise exception 'task_action_unsupported';
    end if;
    if candidate.state <> 'approved'
       or candidate.payload_version <> p_expected_version
       or candidate.payload_hash <> p_expected_hash
       or candidate.approved_payload_version <> p_expected_version
       or candidate.approved_payload_hash <> p_expected_hash then
        raise exception 'task_action_stale_approval';
    end if;
    if candidate.expires_at <= now() then raise exception 'task_action_expired'; end if;

    request_key := concat('candidate:', candidate.id, ':v', candidate.payload_version);
    insert into public.action_requests (
        user_id, candidate_action_id, idempotency_key, action_id, payload,
        payload_hash, payload_version, approval_state, status, policy_version,
        permission_snapshot_hash, approved_payload, approved_payload_hash,
        approved_payload_version, requested_at, decided_at, approved_at, expires_at
    ) values (
        candidate.user_id, candidate.id, request_key, candidate.action_id,
        candidate.payload, candidate.payload_hash, candidate.payload_version,
        'approved', 'queued', 'real-task-actions-v1',
        concat('candidate-review:', candidate.id, ':v', candidate.payload_version),
        candidate.payload, candidate.payload_hash, candidate.payload_version,
        now(), candidate.reviewed_at, candidate.reviewed_at, candidate.expires_at
    )
    on conflict (candidate_action_id, payload_version)
        where candidate_action_id is not null
        do nothing;

    select * into request
    from public.action_requests
    where candidate_action_id = candidate.id
      and payload_version = candidate.payload_version;
    if request.approved_payload_hash is distinct from candidate.payload_hash then
        raise exception 'task_action_request_collision';
    end if;
    update public.candidate_actions set state = 'executing' where id = candidate.id;
    return request;
end;
$$;

create or replace function public.execute_approved_task_action(
    p_action_request_id uuid,
    p_job_id uuid,
    p_attempt integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    request public.action_requests%rowtype;
    existing public.action_results%rowtype;
    task public.todos%rowtype;
    previous jsonb := '{}'::jsonb;
    result_output jsonb;
    expected_updated_at timestamptz;
    task_id uuid;
begin
    select * into request from public.action_requests
    where id = p_action_request_id for update;
    if not found then raise exception 'task_action_request_missing'; end if;
    if request.approval_state <> 'approved'
       or request.approved_payload is distinct from request.payload
       or request.approved_payload_hash is distinct from request.payload_hash
       or request.approved_payload_version is distinct from request.payload_version then
        raise exception 'task_action_stale_approval';
    end if;
    if request.expires_at <= now() then raise exception 'task_action_expired'; end if;
    if request.user_id is distinct from (select user_id from public.jobs where id = p_job_id) then
        raise exception 'task_action_job_owner_mismatch';
    end if;

    select * into existing from public.action_results
    where action_request_id = request.id and status = 'succeeded'
    order by created_at limit 1;
    if found then return existing.output; end if;

    if request.action_id = 'tasks.create' then
        insert into public.todos (
            user_id, text, notes, due_at, source_action_request_id
        ) values (
            request.user_id,
            request.payload->>'title',
            nullif(request.payload->>'notes', ''),
            nullif(request.payload->>'dueAt', '')::timestamptz,
            request.id
        ) on conflict (source_action_request_id) where source_action_request_id is not null
          do nothing;
        select * into task from public.todos
        where source_action_request_id = request.id and user_id = request.user_id;
        if not found then raise exception 'task_action_verification_failed'; end if;
        if task.text is distinct from request.payload->>'title'
           or task.due_at is distinct from nullif(request.payload->>'dueAt', '')::timestamptz
           or coalesce(task.notes, '') is distinct from coalesce(request.payload->>'notes', '') then
            raise exception 'task_action_verification_failed';
        end if;
    elsif request.action_id in ('tasks.update', 'tasks.complete') then
        task_id := (request.payload->>'taskId')::uuid;
        expected_updated_at := (request.payload->>'expectedUpdatedAt')::timestamptz;
        select * into task from public.todos
        where id = task_id and user_id = request.user_id for update;
        if not found then raise exception 'task_action_forbidden'; end if;
        if task.updated_at is distinct from expected_updated_at then
            raise exception 'task_action_edit_conflict';
        end if;
        previous := jsonb_build_object(
            'text', task.text, 'notes', task.notes, 'dueAt', task.due_at,
            'completed', task.completed, 'completedAt', task.completed_at,
            'updatedAt', task.updated_at
        );
        if request.action_id = 'tasks.update' then
            update public.todos set
                text = coalesce(request.payload->>'title', text),
                notes = case when request.payload ? 'notes' then request.payload->>'notes' else notes end,
                due_at = case when request.payload ? 'dueAt' then nullif(request.payload->>'dueAt', '')::timestamptz else due_at end
            where id = task.id returning * into task;
        else
            update public.todos set completed = true, completed_at = now()
            where id = task.id returning * into task;
        end if;
    else
        raise exception 'task_action_unsupported';
    end if;

    select * into task from public.todos where id = task.id and user_id = request.user_id;
    if not found then raise exception 'task_action_verification_failed'; end if;
    if request.action_id = 'tasks.complete' and not task.completed then
        raise exception 'task_action_verification_failed';
    end if;
    result_output := jsonb_build_object(
        'taskId', task.id, 'title', task.text, 'notes', task.notes,
        'dueAt', task.due_at, 'completed', task.completed,
        'completedAt', task.completed_at, 'verifiedUpdatedAt', task.updated_at
    );
    insert into public.action_results (
        user_id, action_request_id, job_id, idempotency_key, attempt, status,
        provider_id, provider_execution_id, output, result_hash, ok, message,
        verification_status, verified_at, undo_status, compensation_metadata,
        started_at, completed_at
    ) values (
        request.user_id, request.id, p_job_id, concat('task-result:', request.id),
        1, 'succeeded', 'local.todos', task.id::text, result_output,
        md5(result_output::text), true,
        'Task action completed and verified.', 'verified', now(),
        case when request.action_id in ('tasks.create', 'tasks.update') then 'available' else 'not_available' end,
        jsonb_build_object('actionId', request.action_id, 'previous', previous),
        coalesce(request.execution_started_at, now()), now()
    ) on conflict (action_request_id, attempt) do nothing;

    update public.action_requests set
        job_id = p_job_id, status = 'completed', execution_started_at = coalesce(execution_started_at, now()),
        execution_completed_at = now(), failure_code = null, failure_detail = null
    where id = request.id;
    update public.candidate_actions set state = 'completed'
    where id = request.candidate_action_id and user_id = request.user_id;
    return result_output;
end;
$$;

create or replace function public.undo_task_action(p_action_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    request public.action_requests%rowtype;
    outcome public.action_results%rowtype;
    task public.todos%rowtype;
    previous jsonb;
begin
    select * into request from public.action_requests
    where id = p_action_request_id and user_id = auth.uid() for update;
    if not found then raise exception 'task_undo_forbidden'; end if;
    select * into outcome from public.action_results
    where action_request_id = request.id and status = 'succeeded' for update;
    if not found or outcome.undo_status <> 'available' then raise exception 'task_undo_unavailable'; end if;
    select * into task from public.todos
    where id = (outcome.output->>'taskId')::uuid and user_id = request.user_id for update;
    if not found then raise exception 'task_undo_conflict'; end if;
    if task.updated_at is distinct from (outcome.output->>'verifiedUpdatedAt')::timestamptz then
        raise exception 'task_undo_conflict';
    end if;
    if request.action_id = 'tasks.create' then
        delete from public.todos where id = task.id;
    elsif request.action_id = 'tasks.update' then
        previous := outcome.compensation_metadata->'previous';
        update public.todos set
            text = previous->>'text', notes = previous->>'notes',
            due_at = (previous->>'dueAt')::timestamptz,
            completed = (previous->>'completed')::boolean,
            completed_at = (previous->>'completedAt')::timestamptz
        where id = task.id;
    else
        raise exception 'task_undo_unavailable';
    end if;
    update public.action_results set undo_status = 'completed', updated_at = now()
    where id = outcome.id;
    return jsonb_build_object('undone', true, 'taskId', task.id);
end;
$$;

revoke all on function public.materialize_approved_task_action(uuid, integer, text) from public, anon;
grant execute on function public.materialize_approved_task_action(uuid, integer, text) to authenticated;
revoke all on function public.execute_approved_task_action(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.execute_approved_task_action(uuid, uuid, integer) to service_role;
revoke all on function public.undo_task_action(uuid) from public, anon;
grant execute on function public.undo_task_action(uuid) to authenticated;
