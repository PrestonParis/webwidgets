begin;
set local search_path=public,extensions;
select no_plan();

select ok(
    has_function_privilege('service_role','public.persist_v2_policy_decision(jsonb,jsonb)','EXECUTE')
    and not has_function_privilege('authenticated','public.persist_v2_policy_decision(jsonb,jsonb)','EXECUTE'),
    'only the service role can persist V2 policy decisions'
);
select ok(
    strpos(
        lower(pg_get_functiondef(
            'public.persist_v2_policy_decision(jsonb,jsonb)'::regprocedure
        )),
        'for update of steps,plans,objectives,budgets'
    ) > 0,
    'persistence locks every runnable target row through the decision write'
);

insert into auth.users(id,instance_id,aud,role,email) values
('d1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','policy-persistence@example.invalid');
insert into public.objectives(id,user_id,client_request_key,title,maturity_level,status,submitted_at)
values ('d1000000-0000-4000-8000-000000000010','d1111111-1111-4111-8111-111111111111',
    'policy-persistence','Create task',2,'submitted',now());
insert into public.objective_versions(
    id,objective_id,user_id,version,intent,permitted_capabilities,policy_version,
    content_hash,published_at
) values ('d1000000-0000-4000-8000-000000000020','d1000000-0000-4000-8000-000000000010',
    'd1111111-1111-4111-8111-111111111111',1,'Create a task','["tasks.create@1"]',
    'v2.policy.1','1111111111111111',now());
insert into public.objective_plans(
    id,objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,graph_hash
) values ('d1000000-0000-4000-8000-000000000030','d1000000-0000-4000-8000-000000000010',
    'd1000000-0000-4000-8000-000000000020','d1111111-1111-4111-8111-111111111111',
    1,2,'planner-v1','registry-v1','2222222222222222');
insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input,input_hash,timeout_seconds,idempotency_scope
) values ('d1000000-0000-4000-8000-000000000040','d1000000-0000-4000-8000-000000000030',
    'd1000000-0000-4000-8000-000000000010','d1111111-1111-4111-8111-111111111111',
    'create-task',0,'tasks.create','1','reversible_write',
    '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}',
    repeat('3',64),30,'objective-step');
update public.objective_plans set status='published',published_at=now()
where id='d1000000-0000-4000-8000-000000000030';
insert into public.objective_budgets(
    id,objective_id,objective_version_id,user_id,max_attempts,max_provider_calls,
    max_model_tokens,max_cost_microunits,max_active_seconds
) values ('d1000000-0000-4000-8000-000000000050','d1000000-0000-4000-8000-000000000010',
    'd1000000-0000-4000-8000-000000000020','d1111111-1111-4111-8111-111111111111',
    3,5,0,0,30);
insert into public.objective_versions(
    id,objective_id,user_id,version,intent,permitted_capabilities,policy_version,
    content_hash,published_at
) values ('d1000000-0000-4000-8000-000000000021','d1000000-0000-4000-8000-000000000010',
    'd1111111-1111-4111-8111-111111111111',2,'Create another task','["tasks.create@1"]',
    'v2.policy.1','1111111111111112',now());
insert into public.objective_budgets(
    id,objective_id,objective_version_id,user_id,version,max_attempts,max_provider_calls,
    max_model_tokens,max_cost_microunits,max_active_seconds
) values ('d1000000-0000-4000-8000-000000000051','d1000000-0000-4000-8000-000000000010',
    'd1000000-0000-4000-8000-000000000021','d1111111-1111-4111-8111-111111111111',
    2,3,5,0,0,30);

create function pg_temp.test_v2_authority() returns jsonb language sql as $$
    select jsonb_build_object(
        'objectiveVersionId','d1000000-0000-4000-8000-000000000020',
        'stepInput',
        '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}'::jsonb,
        'permittedCapabilityKeys','["tasks.create@1"]'::jsonb,
        'consentRecords','[]'::jsonb,
        'connectionAccounts','[]'::jsonb,
        'integrationConnections','[]'::jsonb,
        'delegation','{"state":"disabled"}'::jsonb,
        'budget',jsonb_build_object(
            'id','d1000000-0000-4000-8000-000000000050','status','active',
            'maxAttempts',3,'maxProviderCalls',5,'maxModelTokens',0,
            'maxCostMicrounits',0,'maxActiveSeconds',30,'attemptsUsed',0,
            'providerCallsUsed',0,'modelTokensUsed',0,'costMicrounitsUsed',0,
            'activeSecondsUsed',0
        )
    )
$$;

create function pg_temp.test_v2_decision(p_id uuid) returns jsonb language sql as $$
    select jsonb_build_object(
        'contractVersion','2.0','id',p_id,
        'objectiveId','d1000000-0000-4000-8000-000000000010',
        'planId','d1000000-0000-4000-8000-000000000030',
        'stepId','d1000000-0000-4000-8000-000000000040',
        'budgetId','d1000000-0000-4000-8000-000000000050',
        'userId','d1111111-1111-4111-8111-111111111111',
        'capabilityName','tasks.create','capabilityVersion','1',
        'riskClass','reversible_write','normalizedPayload',
        '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}'::jsonb,
        'payloadHash',repeat('3',64),'policyVersion','v2.policy.1',
        'consentSnapshotHash',repeat('4',64),'connectionSnapshotHash',repeat('5',64),
        'budgetSnapshotHash',repeat('6',64),'delegationSnapshotHash',repeat('7',64),
        'allowlistSnapshotHash',repeat('8',64),'decision','require_approval',
        'reasonCodes','["approval_required"]'::jsonb,'requiresApproval',true,
        'evaluatedAt',now(),'expiresAt',now()+interval '5 minutes'
    )
$$;

set local role service_role;
select lives_ok($$
    select public.persist_v2_policy_decision(jsonb_build_object(
        'contractVersion','2.0','id','d1000000-0000-4000-8000-000000000060',
        'objectiveId','d1000000-0000-4000-8000-000000000010',
        'planId','d1000000-0000-4000-8000-000000000030',
        'stepId','d1000000-0000-4000-8000-000000000040',
        'budgetId','d1000000-0000-4000-8000-000000000050',
        'userId','d1111111-1111-4111-8111-111111111111',
        'capabilityName','tasks.create','capabilityVersion','1',
        'riskClass','reversible_write','normalizedPayload',
        '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}'::jsonb,
        'payloadHash',repeat('3',64),'policyVersion','v2.policy.1',
        'consentSnapshotHash',repeat('4',64),'connectionSnapshotHash',repeat('5',64),
        'budgetSnapshotHash',repeat('6',64),'delegationSnapshotHash',repeat('7',64),
        'allowlistSnapshotHash',repeat('8',64),'decision','require_approval',
        'reasonCodes','["approval_required"]'::jsonb,'requiresApproval',true,
        'evaluatedAt',now(),'expiresAt',now()+interval '5 minutes'
    ),pg_temp.test_v2_authority())
$$,'an exact canonical decision and step persist atomically');
select is((select count(*)::integer from public.objective_policy_decisions),1,
    'one immutable policy decision is stored');
select is((select count(*)::integer from public.objective_approvals where status='pending'),1,
    'one exact pending approval is stored');

select is(
    (public.persist_v2_policy_decision(jsonb_build_object(
        'contractVersion','2.0','id','d1000000-0000-4000-8000-000000000061',
        'objectiveId','d1000000-0000-4000-8000-000000000010','planId','d1000000-0000-4000-8000-000000000030',
        'stepId','d1000000-0000-4000-8000-000000000040','budgetId','d1000000-0000-4000-8000-000000000050',
        'userId','d1111111-1111-4111-8111-111111111111','capabilityName','tasks.create',
        'capabilityVersion','1','riskClass','reversible_write','normalizedPayload',
        '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}'::jsonb,
        'payloadHash',repeat('3',64),'policyVersion','v2.policy.1','consentSnapshotHash',repeat('4',64),
        'connectionSnapshotHash',repeat('5',64),'budgetSnapshotHash',repeat('6',64),
        'delegationSnapshotHash',repeat('7',64),'allowlistSnapshotHash',repeat('8',64),
        'decision','require_approval','reasonCodes','["approval_required"]'::jsonb,
        'requiresApproval',true,'evaluatedAt',now(),'expiresAt',now()+interval '5 minutes'
    ),pg_temp.test_v2_authority())->>'reused')::boolean,
    true,'an identical current decision and approval are reused'
);
select throws_ok($$
    select public.persist_v2_policy_decision(jsonb_build_object(
        'contractVersion','2.0','id','d1000000-0000-4000-8000-000000000062',
        'objectiveId','d1000000-0000-4000-8000-000000000010','planId','d1000000-0000-4000-8000-000000000030',
        'stepId','d1000000-0000-4000-8000-000000000040','budgetId','d1000000-0000-4000-8000-000000000050',
        'userId','d1111111-1111-4111-8111-111111111111','capabilityName','tasks.create',
        'capabilityVersion','1','riskClass','reversible_write','normalizedPayload',
        '{"title":"Review","notes":"","dueAt":null,"sourceReference":null}'::jsonb,
        'payloadHash',repeat('3',64),'policyVersion','v2.policy.1','consentSnapshotHash',repeat('4',64),
        'connectionSnapshotHash',repeat('5',64),'budgetSnapshotHash',repeat('6',64),
        'delegationSnapshotHash',repeat('7',64),'allowlistSnapshotHash',repeat('8',64),
        'decision','allow','reasonCodes','["exact_delegation_allowed"]'::jsonb,
        'requiresApproval',false,'evaluatedAt',now(),'expiresAt',now()+interval '5 minutes'
    ),pg_temp.test_v2_authority())
$$,'P0001',null,'delegation cannot enable execution in the persistence phase');
select throws_ok(
    $$select public.persist_v2_policy_decision(
        jsonb_set(
            pg_temp.test_v2_decision('d1000000-0000-4000-8000-000000000066'),
            '{budgetId}','"d1000000-0000-4000-8000-000000000051"'
        ),
        jsonb_set(
            pg_temp.test_v2_authority(),'{budget,id}',
            '"d1000000-0000-4000-8000-000000000051"'
        )
    )$$,
    'P0002',null,'a budget from another objective version cannot authorize the plan'
);
update public.objective_budgets set attempts_used=1
where id='d1000000-0000-4000-8000-000000000050';
select throws_ok(
    $$select public.persist_v2_policy_decision(
        pg_temp.test_v2_decision('d1000000-0000-4000-8000-000000000063'),
        pg_temp.test_v2_authority()
    )$$,
    'P0001',null,'a changed budget invalidates the authority snapshot'
);
update public.objective_budgets set attempts_used=0
where id='d1000000-0000-4000-8000-000000000050';
insert into public.consent_records(user_id,category,state,scope,granted_at)
values ('d1111111-1111-4111-8111-111111111111','automation','granted',
    'tasks.create@1',now());
select throws_ok(
    $$select public.persist_v2_policy_decision(
        pg_temp.test_v2_decision('d1000000-0000-4000-8000-000000000064'),
        pg_temp.test_v2_authority()
    )$$,
    'P0001',null,'changed consent invalidates the authority snapshot'
);
delete from public.consent_records
where user_id='d1111111-1111-4111-8111-111111111111';
insert into public.integration_connections(
    id,user_id,provider_id,state,scopes
) values (
    'd1000000-0000-4000-8000-000000000070',
    'd1111111-1111-4111-8111-111111111111','google','connected',
    array['calendar.events']
);
select throws_ok(
    $$select public.persist_v2_policy_decision(
        pg_temp.test_v2_decision('d1000000-0000-4000-8000-000000000065'),
        pg_temp.test_v2_authority()
    )$$,
    'P0001',null,'changed connection scopes invalidate the authority snapshot'
);
select throws_ok(
    $$update public.objective_policy_decisions set decision='deny'$$,
    'P0001',null,'persisted policy decisions are append-only'
);
select throws_ok(
    $$delete from public.objective_policy_decisions$$,
    'P0001',null,'persisted policy decisions cannot be deleted'
);
reset role;

select * from finish();
rollback;
