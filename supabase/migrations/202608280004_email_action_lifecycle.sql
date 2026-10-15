create function public.propose_email_action(
    p_user_id uuid, p_action_id text, p_payload jsonb,
    p_payload_hash text, p_idempotency_key uuid
) returns public.action_requests
language plpgsql security definer set search_path = '' as $$
declare
    request public.action_requests%rowtype;
begin
    perform pg_advisory_xact_lock(hashtextextended(concat('email-actions:',p_user_id),0));
    select * into request from public.action_requests
    where user_id=p_user_id and idempotency_key=concat('email:',p_idempotency_key);
    if found then
        if request.payload is distinct from p_payload or request.action_id is distinct from p_action_id
           or request.payload_hash is distinct from p_payload_hash then
            raise exception 'email_idempotency_conflict';
        end if;
        return request;
    end if;
    perform public.assert_email_action_account(p_user_id,p_action_id,p_payload);
    if p_payload_hash is null or p_payload_hash !~ '^[a-f0-9]{64}$' or p_idempotency_key is null then
        raise exception 'email_payload_invalid';
    end if;
    if (select count(*) from public.action_requests where user_id=p_user_id
        and action_id in ('email.draft','email.send') and requested_at > now()-interval '1 minute') >= 5
       or (select count(*) from public.action_requests where user_id=p_user_id
        and action_id in ('email.draft','email.send') and requested_at > now()-interval '1 day') >= 50 then
        raise exception 'email_rate_limited';
    end if;
    insert into public.action_requests(user_id,action_id,payload,payload_hash,payload_version,
        idempotency_key,approval_state,status,policy_version,permission_snapshot_hash,expires_at)
    values(p_user_id,p_action_id,p_payload,p_payload_hash,1,concat('email:',p_idempotency_key),
        'required','pending','email-actions-v1','pending',now()+interval '1 hour')
    returning * into request;
    return request;
end;
$$;
revoke all on function public.propose_email_action(uuid,text,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.propose_email_action(uuid,text,jsonb,text,uuid) to service_role;

-- A late uncertain response must not overwrite an already verified receipt.
create function public.record_email_action_outcome(
    p_request_id uuid, p_job_id uuid, p_outcome jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    request public.action_requests%rowtype;
    dispatch public.email_action_dispatches%rowtype;
    outcome_state text := p_outcome->>'state';
    safe_receipt jsonb;
    provider_object text := p_outcome->>'providerObjectId';
begin
    select * into request from public.action_requests where id=p_request_id for update;
    if not found or request.action_id not in ('email.draft','email.send')
       or not exists (select 1 from public.jobs where id=p_job_id and user_id=request.user_id
          and type='action.execute' and metadata->'task'->>'actionRequestId'=request.id::text) then
        raise exception 'email_outcome_forbidden';
    end if;
    select * into dispatch from public.email_action_dispatches where action_request_id=p_request_id for update;
    if not found then raise exception 'email_dispatch_missing'; end if;
    if dispatch.state in ('verified','failed') then return dispatch.receipt; end if;
    if outcome_state is null or outcome_state not in ('verified','unknown','failed') then
        raise exception 'email_outcome_invalid';
    end if;
    if outcome_state='verified' and (provider_object is null
       or p_outcome->>'providerMessageId' is null or p_outcome->>'threadId' is null) then
        raise exception 'email_receipt_invalid';
    end if;
    safe_receipt := jsonb_build_object('state',outcome_state,'providerObjectId',provider_object,
        'providerMessageId',p_outcome->>'providerMessageId','threadId',p_outcome->>'threadId',
        'code',case when outcome_state='verified' then
            case when request.action_id='email.draft' then 'draft_verified' else 'sent_verified_not_delivery' end
            when outcome_state='failed' then 'email_execution_blocked' else 'email_outcome_unknown' end);
    update public.email_action_dispatches set state=outcome_state,
        provider_object_id=coalesce(provider_object,provider_object_id),receipt=safe_receipt,updated_at=now()
    where action_request_id=request.id;
    insert into public.action_results(user_id,action_request_id,job_id,idempotency_key,attempt,status,
        provider_id,provider_execution_id,output,result_hash,ok,message,verification_status,verified_at,
        undo_status,started_at,completed_at)
    values(request.user_id,request.id,p_job_id,concat('email-result:',request.id),1,
        case when outcome_state='verified' then 'succeeded' when outcome_state='failed' then 'failed' else 'unknown' end,
        request.payload->>'provider',case when outcome_state='verified' then concat(request.payload->>'accountId',':',request.action_id,':',provider_object) end,
        safe_receipt,md5(safe_receipt::text),outcome_state='verified',safe_receipt->>'code',
        case when outcome_state='verified' then 'verified' else 'unverifiable' end,
        case when outcome_state='verified' then now() end,'not_available',dispatch.reserved_at,now())
    on conflict(action_request_id,attempt) do update set
        status=excluded.status,provider_execution_id=excluded.provider_execution_id,output=excluded.output,
        result_hash=excluded.result_hash,ok=excluded.ok,message=excluded.message,
        verification_status=excluded.verification_status,verified_at=excluded.verified_at,completed_at=excluded.completed_at;
    update public.action_requests set
        status=case when outcome_state='verified' then 'completed' when outcome_state='failed' then 'failed' else 'deferred' end,
        job_id=p_job_id,execution_started_at=dispatch.reserved_at,
        execution_completed_at=case when outcome_state<>'unknown' then now() end,
        failure_code=case when outcome_state<>'verified' then safe_receipt->>'code' end,
        state_version=state_version+1
    where id=request.id;
    return safe_receipt;
end;
$$;
revoke all on function public.record_email_action_outcome(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_email_action_outcome(uuid,uuid,jsonb) to service_role;
