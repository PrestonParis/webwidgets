create function public.record_calendar_action_outcome(p_request_id uuid,p_job_id uuid,p_outcome jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.calendar_action_dispatches%rowtype;
    outcome_state text:=p_outcome->>'state';safe_receipt jsonb;provider_object text:=p_outcome->>'providerObjectId';
begin
    select * into request from public.action_requests where id=p_request_id for update;
    if not found or request.action_id<>'calendar.create_event'
       or not exists(select 1 from public.jobs where id=p_job_id and user_id=request.user_id
          and metadata->'task'->>'actionRequestId'=request.id::text) then raise exception 'calendar_outcome_forbidden'; end if;
    select * into dispatch from public.calendar_action_dispatches where action_request_id=request.id for update;
    if not found then raise exception 'calendar_dispatch_missing'; end if;
    if dispatch.state in ('verified','failed','cancelled') then return dispatch.receipt; end if;
    if outcome_state not in ('verified','unknown','failed') then raise exception 'calendar_outcome_invalid'; end if;
    if outcome_state='verified' and (provider_object is null or p_outcome->>'htmlLink' is null
       or p_outcome->>'start' is null or p_outcome->>'end' is null) then raise exception 'calendar_receipt_invalid'; end if;
    safe_receipt:=jsonb_build_object('state',outcome_state,'providerObjectId',provider_object,
        'htmlLink',p_outcome->>'htmlLink','start',p_outcome->>'start','end',p_outcome->>'end',
        'code',case when outcome_state='verified' then 'calendar_event_verified'
          when outcome_state='failed' then 'calendar_execution_blocked' else 'calendar_outcome_unknown' end);
    update public.calendar_action_dispatches set state=outcome_state,provider_object_id=provider_object,
        receipt=safe_receipt,undo_state=case when outcome_state='verified' then 'available' else 'not_available' end,updated_at=now()
    where action_request_id=request.id;
    insert into public.action_results(user_id,action_request_id,job_id,idempotency_key,attempt,status,
        provider_id,provider_execution_id,output,result_hash,ok,message,verification_status,verified_at,
        undo_status,started_at,completed_at)
    values(request.user_id,request.id,p_job_id,concat('calendar-result:',request.id),1,
        case when outcome_state='verified' then 'succeeded' when outcome_state='failed' then 'failed' else 'unknown' end,
        'google.calendar',case when outcome_state='verified' then provider_object end,safe_receipt,md5(safe_receipt::text),
        outcome_state='verified',safe_receipt->>'code',case when outcome_state='verified' then 'verified' else 'unverifiable' end,
        case when outcome_state='verified' then now() end,case when outcome_state='verified' then 'available' else 'not_available' end,
        dispatch.reserved_at,now()) on conflict(action_request_id,attempt) do update set
        status=excluded.status,provider_execution_id=excluded.provider_execution_id,output=excluded.output,
        result_hash=excluded.result_hash,ok=excluded.ok,message=excluded.message,
        verification_status=excluded.verification_status,verified_at=excluded.verified_at,
        undo_status=excluded.undo_status,completed_at=excluded.completed_at;
    update public.action_requests set status=case when outcome_state='verified' then 'completed'
        when outcome_state='failed' then 'failed' else 'deferred' end,job_id=p_job_id,
        execution_started_at=dispatch.reserved_at,execution_completed_at=case when outcome_state<>'unknown' then now() end,
        failure_code=case when outcome_state<>'verified' then safe_receipt->>'code' end,state_version=state_version+1
    where id=request.id;return safe_receipt;
end;$$;
revoke all on function public.record_calendar_action_outcome(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_calendar_action_outcome(uuid,uuid,jsonb) to service_role;

create function public.begin_calendar_action_undo(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request public.action_requests%rowtype;dispatch public.calendar_action_dispatches%rowtype;
begin
    select * into request from public.action_requests where id=p_request_id and user_id=auth.uid() for update;
    if not found or request.status<>'completed' then raise exception 'calendar_undo_forbidden'; end if;
    select * into dispatch from public.calendar_action_dispatches where action_request_id=request.id for update;
    if not found or dispatch.state<>'verified' or dispatch.undo_state not in ('available','requested')
       then raise exception 'calendar_undo_unavailable'; end if;
    update public.calendar_action_dispatches set undo_state='requested',updated_at=now() where action_request_id=request.id;
    return jsonb_build_object('userId',request.user_id,'accountId',dispatch.account_id,
        'eventId',dispatch.provider_object_id,'payload',request.payload);
end;$$;
revoke all on function public.begin_calendar_action_undo(uuid) from public,anon;
grant execute on function public.begin_calendar_action_undo(uuid) to authenticated;

create function public.record_calendar_action_undo(p_request_id uuid,p_user_id uuid,p_deleted boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
    update public.calendar_action_dispatches set state=case when p_deleted then 'cancelled' else state end,
        undo_state=case when p_deleted then 'completed' else 'failed' end,updated_at=now(),
        receipt=receipt||jsonb_build_object('undoVerified',p_deleted,'undoCode',case when p_deleted then 'calendar_event_cancelled' else 'calendar_undo_unverified' end)
    where action_request_id=p_request_id and user_id=p_user_id and undo_state='requested';
    if not found then raise exception 'calendar_undo_forbidden'; end if;
    update public.action_results set undo_status=case when p_deleted then 'completed' else 'failed' end,
        compensation_metadata=jsonb_build_object('deleted',p_deleted),updated_at=now()
    where action_request_id=p_request_id and user_id=p_user_id;
end;$$;
revoke all on function public.record_calendar_action_undo(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.record_calendar_action_undo(uuid,uuid,boolean) to service_role;
