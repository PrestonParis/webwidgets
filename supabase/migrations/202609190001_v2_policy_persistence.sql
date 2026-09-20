create function public.lock_v2_policy_authority_writer()
returns trigger language plpgsql set search_path = '' as $$
declare
    owner_id uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
begin
    perform pg_advisory_xact_lock(
        hashtextextended('v2-policy-authority:' || owner_id::text, 0)
    );
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger consent_records_v2_policy_authority_lock
    before insert or update or delete on public.consent_records
    for each row execute function public.lock_v2_policy_authority_writer();
create trigger user_email_accounts_v2_policy_authority_lock
    before insert or update or delete on public.user_email_accounts
    for each row execute function public.lock_v2_policy_authority_writer();
create trigger integration_connections_v2_policy_authority_lock
    before insert or update or delete on public.integration_connections
    for each row execute function public.lock_v2_policy_authority_writer();
create trigger objective_budgets_v2_policy_authority_lock
    before insert or update or delete on public.objective_budgets
    for each row execute function public.lock_v2_policy_authority_writer();

create function public.persist_v2_policy_decision(
    p_decision jsonb,
    p_authority jsonb
)
returns jsonb language plpgsql set search_path = '' as $$
declare
    target_decision_id uuid; target_objective_id uuid; target_plan_id uuid;
    target_step_id uuid; target_budget_id uuid; target_owner_id uuid;
    target_evaluated_at timestamptz; target_expires_at timestamptz;
    target_decision text; target_requires_approval boolean; step_record record;
    existing_decision_id uuid; existing_approval_id uuid; created_approval_id uuid;
begin
    if current_user not in ('postgres', 'service_role') then
        raise exception 'v2_policy_persistence_forbidden';
    end if;
    if p_decision is null or jsonb_typeof(p_decision) <> 'object' then
        raise exception 'v2_policy_decision_invalid';
    end if;
    if p_authority is null or jsonb_typeof(p_authority) <> 'object' then
        raise exception 'v2_policy_authority_invalid';
    end if;
    if exists (
        select 1 from jsonb_object_keys(p_decision) as supplied(key)
        where supplied.key not in (
            'contractVersion','id','objectiveId','planId','stepId','budgetId',
            'userId','capabilityName','capabilityVersion','riskClass',
            'normalizedPayload','payloadHash','policyVersion',
            'consentSnapshotHash','connectionSnapshotHash','budgetSnapshotHash',
            'delegationSnapshotHash','allowlistSnapshotHash','decision',
            'reasonCodes','requiresApproval','evaluatedAt','expiresAt'
        )
    ) or jsonb_typeof(p_decision->'reasonCodes') <> 'array' then
        raise exception 'v2_policy_decision_unknown_or_invalid_field';
    end if;
    begin
        target_decision_id := (p_decision->>'id')::uuid;
        target_objective_id := (p_decision->>'objectiveId')::uuid;
        target_plan_id := (p_decision->>'planId')::uuid;
        target_step_id := (p_decision->>'stepId')::uuid;
        target_budget_id := (p_decision->>'budgetId')::uuid;
        target_owner_id := (p_decision->>'userId')::uuid;
        target_evaluated_at := (p_decision->>'evaluatedAt')::timestamptz;
        target_expires_at := (p_decision->>'expiresAt')::timestamptz;
        target_decision := p_decision->>'decision';
        target_requires_approval := (p_decision->>'requiresApproval')::boolean;
    exception when others then raise exception 'v2_policy_decision_invalid';
    end;
    if p_decision->>'contractVersion' <> '2.0'
       or p_decision->>'policyVersion' <> 'v2.policy.1'
       or target_decision not in ('allow','deny','require_approval')
       or target_requires_approval is distinct from
          (target_decision = 'require_approval') then
        raise exception 'v2_policy_decision_contract_invalid';
    end if;
    if target_evaluated_at < now() - interval '1 minute'
       or target_evaluated_at > now() + interval '30 seconds'
       or target_expires_at <= now()
       or target_expires_at > target_evaluated_at + interval '5 minutes' then
        raise exception 'v2_policy_decision_stale';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('v2-policy-authority:' || target_owner_id::text, 0)
    );

    perform 1 from public.consent_records
    where user_id=target_owner_id for share;
    perform 1 from public.user_email_accounts
    where user_id=target_owner_id for share;
    perform 1 from public.integration_connections
    where user_id=target_owner_id for share;

    select steps.capability_name,steps.capability_version,steps.risk_class,
        steps.input,steps.input_hash,plans.status as plan_status,
        plans.objective_version_id,objectives.status as objective_status,
        versions.permitted_capabilities,versions.policy_version,
        budgets.status as budget_status,
        jsonb_build_object(
            'id',budgets.id,'status',budgets.status,
            'maxAttempts',budgets.max_attempts,
            'maxProviderCalls',budgets.max_provider_calls,
            'maxModelTokens',budgets.max_model_tokens,
            'maxCostMicrounits',budgets.max_cost_microunits,
            'maxActiveSeconds',budgets.max_active_seconds,
            'attemptsUsed',budgets.attempts_used,
            'providerCallsUsed',budgets.provider_calls_used,
            'modelTokensUsed',budgets.model_tokens_used,
            'costMicrounitsUsed',budgets.cost_microunits_used,
            'activeSecondsUsed',budgets.active_seconds_used
        ) as budget_snapshot,
        (select coalesce(jsonb_agg(jsonb_build_object(
            'scope',consent.scope,'state',consent.state
        ) order by consent.scope),'[]'::jsonb)
         from public.consent_records consent
         where consent.user_id=target_owner_id and consent.category='automation'
        ) as consent_records,
        (select coalesce(jsonb_agg(jsonb_build_object(
            'id',account.id,'provider',account.provider,
            'integrationConnectionId',account.integration_connection_id
        ) order by account.id),'[]'::jsonb)
         from public.user_email_accounts account
         where account.user_id=target_owner_id
        ) as connection_accounts,
        (select coalesce(jsonb_agg(jsonb_build_object(
            'id',connection.id,'providerId',connection.provider_id,
            'state',connection.state,'scopes',connection.scopes
        ) order by connection.id),'[]'::jsonb)
         from public.integration_connections connection
         where connection.user_id=target_owner_id
        ) as integration_connections
    into strict step_record
    from public.objective_plan_steps as steps
    join public.objective_plans as plans on plans.id=steps.plan_id
      and plans.objective_id=steps.objective_id and plans.user_id=steps.user_id
    join public.objectives as objectives on objectives.id=steps.objective_id
      and objectives.user_id=steps.user_id
    join public.objective_versions as versions
      on versions.id=plans.objective_version_id
      and versions.objective_id=steps.objective_id
      and versions.user_id=steps.user_id
    join public.objective_budgets as budgets on budgets.id=target_budget_id
      and budgets.objective_id=steps.objective_id and budgets.user_id=steps.user_id
      and budgets.objective_version_id=plans.objective_version_id
    where steps.id=target_step_id and steps.plan_id=target_plan_id
      and steps.objective_id=target_objective_id and steps.user_id=target_owner_id
    for update of steps,plans,objectives,budgets;
    if step_record.plan_status <> 'published' then
        raise exception 'v2_policy_target_not_runnable';
    end if;
    if (step_record.objective_status not in ('submitted','active')
        or step_record.budget_status <> 'active') and target_decision <> 'deny' then
        raise exception 'v2_policy_target_not_runnable';
    end if;
    if step_record.objective_version_id <> (p_authority->>'objectiveVersionId')::uuid
       or step_record.input <> p_authority->'stepInput'
       or step_record.permitted_capabilities <> p_authority->'permittedCapabilityKeys'
       or step_record.policy_version <> p_decision->>'policyVersion'
       or step_record.budget_snapshot <> p_authority->'budget'
       or step_record.consent_records <> p_authority->'consentRecords'
       or step_record.connection_accounts <> p_authority->'connectionAccounts'
       or step_record.integration_connections <> p_authority->'integrationConnections'
       or p_authority->'delegation' <> '{"state":"disabled"}'::jsonb then
        raise exception 'v2_policy_authority_stale';
    end if;
    if step_record.capability_name <> p_decision->>'capabilityName'
       or step_record.capability_version <> p_decision->>'capabilityVersion'
       or step_record.risk_class <> p_decision->>'riskClass'
       or step_record.input <> p_decision->'normalizedPayload'
       or step_record.input_hash <> p_decision->>'payloadHash' then
        raise exception 'v2_policy_step_binding_mismatch';
    end if;
    if step_record.risk_class='prohibited' and target_decision<>'deny' then
        raise exception 'v2_policy_prohibited_capability';
    end if;
    if step_record.risk_class in ('sensitive','destructive')
       and target_decision<>'require_approval' then
        raise exception 'v2_policy_mandatory_approval';
    end if;
    if step_record.risk_class in ('reversible_write','external')
       and target_decision='allow' then
        raise exception 'v2_policy_delegation_not_enabled';
    end if;

    select decisions.id,approvals.id into existing_decision_id,existing_approval_id
    from public.objective_policy_decisions as decisions
    left join public.objective_approvals as approvals
      on approvals.policy_decision_id=decisions.id and approvals.status='pending'
    where decisions.objective_id=target_objective_id
      and decisions.plan_id=target_plan_id and decisions.step_id=target_step_id
      and decisions.budget_id=target_budget_id and decisions.user_id=target_owner_id
      and decisions.capability_name=p_decision->>'capabilityName'
      and decisions.capability_version=p_decision->>'capabilityVersion'
      and decisions.risk_class=p_decision->>'riskClass'
      and decisions.normalized_payload=p_decision->'normalizedPayload'
      and decisions.payload_hash=p_decision->>'payloadHash'
      and decisions.policy_version=p_decision->>'policyVersion'
      and decisions.consent_snapshot_hash=p_decision->>'consentSnapshotHash'
      and decisions.connection_snapshot_hash=p_decision->>'connectionSnapshotHash'
      and decisions.budget_snapshot_hash=p_decision->>'budgetSnapshotHash'
      and decisions.delegation_snapshot_hash=p_decision->>'delegationSnapshotHash'
      and decisions.allowlist_snapshot_hash=p_decision->>'allowlistSnapshotHash'
      and decisions.decision=target_decision and decisions.expires_at>now()
      and (target_decision<>'require_approval' or approvals.id is not null)
    order by decisions.evaluated_at desc limit 1;
    if existing_decision_id is not null then
        return jsonb_build_object('decisionId',existing_decision_id,
            'approvalId',existing_approval_id,'reused',true);
    end if;

    update public.objective_approvals as approvals
    set status='revoked',decided_at=now()
    where approvals.step_id=target_step_id and approvals.plan_id=target_plan_id
      and approvals.objective_id=target_objective_id
      and approvals.user_id=target_owner_id and approvals.status='pending';
    insert into public.objective_policy_decisions(
        id,objective_id,plan_id,step_id,budget_id,user_id,capability_name,
        capability_version,risk_class,normalized_payload,payload_hash,
        policy_version,consent_snapshot_hash,connection_snapshot_hash,
        budget_snapshot_hash,delegation_snapshot_hash,allowlist_snapshot_hash,
        decision,reason_codes,requires_approval,evaluated_at,expires_at
    ) values (
        target_decision_id,target_objective_id,target_plan_id,target_step_id,
        target_budget_id,target_owner_id,p_decision->>'capabilityName',
        p_decision->>'capabilityVersion',p_decision->>'riskClass',
        p_decision->'normalizedPayload',p_decision->>'payloadHash',
        p_decision->>'policyVersion',p_decision->>'consentSnapshotHash',
        p_decision->>'connectionSnapshotHash',p_decision->>'budgetSnapshotHash',
        p_decision->>'delegationSnapshotHash',p_decision->>'allowlistSnapshotHash',
        target_decision,
        array(select jsonb_array_elements_text(p_decision->'reasonCodes')),
        target_requires_approval,target_evaluated_at,target_expires_at
    );
    if target_requires_approval then
        created_approval_id := gen_random_uuid();
        insert into public.objective_approvals(
            id,objective_id,plan_id,step_id,policy_decision_id,user_id,payload,
            payload_hash,payload_version,status,requested_at,expires_at
        ) values (
            created_approval_id,target_objective_id,target_plan_id,target_step_id,
            target_decision_id,target_owner_id,p_decision->'normalizedPayload',
            p_decision->>'payloadHash',1,'pending',target_evaluated_at,
            target_expires_at
        );
    end if;
    return jsonb_build_object('decisionId',target_decision_id,
        'approvalId',created_approval_id,'reused',false);
end; $$;

revoke all on function public.persist_v2_policy_decision(jsonb,jsonb) from public;
revoke all on function public.persist_v2_policy_decision(jsonb,jsonb)
    from anon, authenticated;
grant execute on function public.persist_v2_policy_decision(jsonb,jsonb)
    to service_role;
