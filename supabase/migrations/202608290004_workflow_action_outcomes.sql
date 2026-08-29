create function public.claim_workflow_action(p_request_id uuid,p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.workflow_action_dispatches%rowtype;inserted_count integer;
begin
    select * into request from public.action_requests where id=p_request_id for update;
    if not found or request.action_id<>'automation.run' or request.approval_state<>'approved'
       or request.status='cancelled' or request.approved_payload is distinct from request.payload
       or request.approved_payload_hash is distinct from request.payload_hash
       or request.approved_payload_version is distinct from request.payload_version
       or request.permission_snapshot_hash is distinct from concat('workflow-explicit:',request.id,':',request.payload_hash)
       or request.automation_run_id is null
       or (request.expires_at<=now() and not exists(select 1 from public.workflow_action_dispatches where action_request_id=request.id))
       or not exists(select 1 from public.jobs where id=p_job_id and user_id=request.user_id
          and type='action.execute' and metadata->'task'->>'actionRequestId'=request.id::text)
       then raise exception 'workflow_action_stale_approval'; end if;
    perform public.assert_workflow_action_config(request.user_id,request.payload);
    insert into public.workflow_action_dispatches(action_request_id,user_id,automation_run_id,workflow_key,payload_hash)
    values(request.id,request.user_id,request.automation_run_id,request.payload->>'workflowKey',request.payload_hash)
    on conflict(action_request_id) do nothing;get diagnostics inserted_count=row_count;
    if inserted_count=1 then
        update public.action_requests set status='running',execution_started_at=now() where id=request.id;
        update public.automation_runs set status='running',job_id=p_job_id,started_at=coalesce(started_at,now()),updated_at=now()
            where id=request.automation_run_id and user_id=request.user_id;
    end if;
    select * into dispatch from public.workflow_action_dispatches where action_request_id=request.id;
    if dispatch.payload_hash is distinct from request.payload_hash then raise exception 'workflow_dispatch_conflict'; end if;
    return jsonb_build_object('dispatchAllowed',inserted_count=1,'state',dispatch.state,
        'providerObjectId',dispatch.provider_object_id,'receipt',dispatch.receipt);
end;$$;
revoke all on function public.claim_workflow_action(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_workflow_action(uuid,uuid) to service_role;

create function public.record_workflow_dispatch(p_request_id uuid,p_job_id uuid,p_outcome jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.workflow_action_dispatches%rowtype;
    outcome_state text:=p_outcome->>'state';provider_object text:=p_outcome->>'providerObjectId';safe_receipt jsonb;
begin
    select * into request from public.action_requests where id=p_request_id for update;
    if not found or request.action_id<>'automation.run' or not exists(select 1 from public.jobs where id=p_job_id
       and user_id=request.user_id and metadata->'task'->>'actionRequestId'=request.id::text)
       then raise exception 'workflow_outcome_forbidden'; end if;
    select * into dispatch from public.workflow_action_dispatches where action_request_id=request.id for update;
    if not found then raise exception 'workflow_dispatch_missing'; end if;
    if dispatch.state in ('accepted','completed','failed') then return dispatch.receipt; end if;
    if outcome_state not in ('accepted','unknown','failed') or (outcome_state='accepted' and provider_object is null)
       then raise exception 'workflow_outcome_invalid'; end if;
    safe_receipt:=jsonb_build_object('state',outcome_state,'providerObjectId',provider_object,
       'code',case when outcome_state='accepted' then 'workflow_dispatch_verified'
          when outcome_state='failed' then 'workflow_dispatch_failed' else 'workflow_outcome_unknown' end);
    update public.workflow_action_dispatches set state=outcome_state,provider_object_id=provider_object,
        receipt=safe_receipt,updated_at=now() where action_request_id=request.id;
    insert into public.action_results(user_id,action_request_id,job_id,idempotency_key,attempt,status,provider_id,
        provider_execution_id,output,result_hash,ok,message,verification_status,undo_status,started_at,completed_at)
    values(request.user_id,request.id,p_job_id,concat('workflow-result:',request.id),1,
        case when outcome_state='accepted' then 'started' when outcome_state='failed' then 'failed' else 'unknown' end,
        'n8n',provider_object,safe_receipt,md5(safe_receipt::text),false,safe_receipt->>'code',
        case when outcome_state='accepted' then 'pending' else 'unverifiable' end,'not_available',dispatch.reserved_at,
        case when outcome_state='accepted' then null else now() end)
    on conflict(action_request_id,attempt) do update set status=excluded.status,provider_execution_id=excluded.provider_execution_id,
        output=excluded.output,result_hash=excluded.result_hash,message=excluded.message,
        verification_status=excluded.verification_status,completed_at=excluded.completed_at;
    update public.action_requests set status=case when outcome_state='accepted' then 'running'
        when outcome_state='failed' then 'failed' else 'deferred' end,job_id=p_job_id,
        failure_code=case when outcome_state<>'accepted' then safe_receipt->>'code' end,state_version=state_version+1
        where id=request.id;
    update public.automation_runs set status=case when outcome_state='accepted' then 'running'
        when outcome_state='failed' then 'failed' else 'running' end,failure_code=case when outcome_state<>'accepted' then safe_receipt->>'code' end,
        updated_at=now() where id=request.automation_run_id and user_id=request.user_id;
    return safe_receipt;
end;$$;
revoke all on function public.record_workflow_dispatch(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_workflow_dispatch(uuid,uuid,jsonb) to service_role;

create function public.record_workflow_callback(p_callback_id text,p_user_id uuid,p_request_id uuid,p_job_id uuid,
    p_idempotency_key text,p_run_id text,p_status text,p_result jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.workflow_action_dispatches%rowtype;inserted_count integer;safe_receipt jsonb;
begin
    select * into request from public.action_requests where id=p_request_id and user_id=p_user_id for update;
    if not found or request.action_id<>'automation.run' or request.job_id is distinct from p_job_id
       or request.idempotency_key is distinct from p_idempotency_key then raise exception 'workflow_callback_forbidden'; end if;
    select * into dispatch from public.workflow_action_dispatches where action_request_id=request.id for update;
    if not found or (dispatch.provider_object_id is not null and dispatch.provider_object_id is distinct from p_run_id)
       or dispatch.state not in ('accepted','unknown','completed','failed')
       or p_status not in ('completed','failed') then raise exception 'workflow_callback_mismatch'; end if;
    insert into public.workflow_action_callbacks(callback_id,action_request_id,user_id)
    values(p_callback_id,request.id,request.user_id) on conflict(callback_id) do nothing;get diagnostics inserted_count=row_count;
    if inserted_count=0 then return false; end if;
    safe_receipt:=jsonb_build_object('state',p_status,'providerObjectId',p_run_id,
        'code',case when p_status='completed' then 'workflow_completed_verified' else 'workflow_failed_verified' end);
    update public.workflow_action_dispatches set state=p_status,provider_object_id=p_run_id,receipt=safe_receipt,updated_at=now()
        where action_request_id=request.id;
    update public.action_results set status=case when p_status='completed' then 'succeeded' else 'failed' end,
        output=jsonb_build_object('receipt',safe_receipt,'result',p_result),result_hash=md5(concat(safe_receipt::text,p_result::text)),
        ok=p_status='completed',message=safe_receipt->>'code',verification_status='verified',verified_at=now(),completed_at=now()
        where action_request_id=request.id and user_id=request.user_id;
    update public.action_requests set status=case when p_status='completed' then 'completed' else 'failed' end,
        execution_completed_at=now(),failure_code=case when p_status='failed' then 'workflow_failed_verified' end,state_version=state_version+1
        where id=request.id;
    update public.automation_runs set status=p_status,result=p_result,completed_at=now(),
        failure_code=case when p_status='failed' then 'workflow_failed_verified' end,updated_at=now()
        where id=request.automation_run_id and user_id=request.user_id;return true;
end;$$;
revoke all on function public.record_workflow_callback(text,uuid,uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_workflow_callback(text,uuid,uuid,uuid,text,text,text,jsonb) to service_role;
