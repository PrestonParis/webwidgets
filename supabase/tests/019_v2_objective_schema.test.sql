begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('f1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','v2-owner@example.invalid'),
('f2222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','v2-other@example.invalid');

insert into public.collaboration_workspaces(id,user_id,name) values
('f1000000-0000-4000-8000-000000000001','f1111111-1111-4111-8111-111111111111','Owner workspace'),
('f2000000-0000-4000-8000-000000000001','f2222222-2222-4222-8222-222222222222','Other workspace');

select ok(bool_and(c.relrowsecurity), 'RLS is enabled on every V2 user table')
from (values
    ('objectives'), ('objective_versions'), ('objective_plans'),
    ('objective_plan_steps'), ('objective_step_dependencies'),
    ('objective_budgets'), ('objective_policy_decisions'), ('objective_approvals'),
    ('objective_runs'), ('objective_step_attempts'), ('objective_step_results'),
    ('objective_external_effects'), ('objective_verification_results'),
    ('objective_execution_evidence')
) as expected(name)
join pg_class c on c.relname=expected.name
join pg_namespace n on n.oid=c.relnamespace and n.nspname='public';

select is(count(*)::integer, 14, 'every V2 user table has an authenticated policy')
from (values
    ('objectives'), ('objective_versions'), ('objective_plans'),
    ('objective_plan_steps'), ('objective_step_dependencies'),
    ('objective_budgets'), ('objective_policy_decisions'), ('objective_approvals'),
    ('objective_runs'), ('objective_step_attempts'), ('objective_step_results'),
    ('objective_external_effects'), ('objective_verification_results'),
    ('objective_execution_evidence')
) as expected(name)
where exists (
    select 1 from pg_policies
    where schemaname='public' and tablename=expected.name
      and 'authenticated'=any(roles)
);

select ok(not has_table_privilege('anon','public.objectives','SELECT')
    and not has_table_privilege('anon','public.objective_execution_evidence','SELECT'),
    'anonymous clients have no V2 table access');
select ok(has_table_privilege('service_role','public.objective_runs','INSERT')
    and has_table_privilege('service_role','public.objective_execution_evidence','DELETE'),
    'service role retains the explicit runtime and retention path');
select ok(not has_table_privilege('authenticated','public.objective_runs','INSERT')
    and not has_table_privilege('authenticated','public.objective_policy_decisions','UPDATE')
    and has_table_privilege('authenticated','public.objective_runs','SELECT'),
    'authenticated clients can read but cannot forge privileged ledgers');

set local role authenticated;
set local request.jwt.claim.sub='f1111111-1111-4111-8111-111111111111';

insert into public.objectives(
    id,user_id,workspace_id,client_request_key,title,maturity_level
) values (
    'f1000000-0000-4000-8000-000000000010',auth.uid(),
    'f1000000-0000-4000-8000-000000000001','request-1','Prepare report',4
);
select is((select count(*)::integer from public.objectives), 1,
    'owner can read the owned objective');

select throws_ok($$insert into public.objectives(
    user_id,workspace_id,client_request_key,title,maturity_level
) values (
    auth.uid(),'f2000000-0000-4000-8000-000000000001','request-cross','Cross tenant',1
)$$, '23503', null, 'cross-tenant workspace reference is rejected');

insert into public.objective_versions(
    id,objective_id,user_id,version,intent,policy_version,content_hash
) values (
    'f1000000-0000-4000-8000-000000000020',
    'f1000000-0000-4000-8000-000000000010',auth.uid(),1,
    'Create a bounded report','policy-v1','1111111111111111'
);
insert into public.objective_plans(
    id,objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,graph_hash
) values (
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000020',auth.uid(),1,4,
    'planner-v1','registry-v1','2222222222222222'
);
insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input_hash,timeout_seconds,idempotency_scope
) values (
    'f1000000-0000-4000-8000-000000000040',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000010',auth.uid(),'draft-report',0,
    'tasks.create','1','reversible_write','3333333333333333',60,'objective-step'
);

update public.objective_versions set published_at=now()
where id='f1000000-0000-4000-8000-000000000020';
update public.objective_plans set status='published',published_at=now()
where id='f1000000-0000-4000-8000-000000000030';

select throws_ok($$update public.objective_versions set intent='rewritten'
    where id='f1000000-0000-4000-8000-000000000020'$$,
    'P0001',null,'published objective versions are immutable');
select throws_ok($$update public.objective_plan_steps set input='{"changed":true}'
    where id='f1000000-0000-4000-8000-000000000040'$$,
    'P0001',null,'published plan steps are immutable');
select throws_ok($$update public.objectives
    set status='completed',completed_at=now(),state_version=2
    where id='f1000000-0000-4000-8000-000000000010'$$,
    'P0001',null,'invalid objective transitions are rejected');
select lives_ok($$update public.objectives
    set status='submitted',submitted_at=now(),state_version=2
    where id='f1000000-0000-4000-8000-000000000010'$$,
    'valid objective transition with next state version succeeds');

set local request.jwt.claim.sub='f2222222-2222-4222-8222-222222222222';
select is((select count(*)::integer from public.objectives), 0,
    'another tenant cannot read the objective');
select lives_ok($$update public.objectives set title='stolen'
    where id='f1000000-0000-4000-8000-000000000010'$$,
    'cross-tenant objective update is filtered by RLS');
reset role;

select is((select title from public.objectives
    where id='f1000000-0000-4000-8000-000000000010'),
    'Prepare report','cross-tenant update did not modify the objective');

set local role service_role;
insert into public.objective_budgets(
    id,objective_id,objective_version_id,user_id,max_attempts,max_provider_calls,
    max_model_tokens,max_cost_microunits,max_active_seconds
) values (
    'f1000000-0000-4000-8000-000000000050',
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000020',
    'f1111111-1111-4111-8111-111111111111',3,2,1000,1000000,300
);
insert into public.objective_runs(
    id,objective_id,plan_id,budget_id,user_id,run_number
) values (
    'f1000000-0000-4000-8000-000000000060',
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000050',
    'f1111111-1111-4111-8111-111111111111',1
);
insert into public.objective_step_attempts(
    id,run_id,plan_id,objective_id,step_id,user_id,attempt_number,
    idempotency_key,executor_version,ownership_epoch
) values (
    'f1000000-0000-4000-8000-000000000070',
    'f1000000-0000-4000-8000-000000000060',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000040',
    'f1111111-1111-4111-8111-111111111111',1,'attempt-1','executor-v1',1
);
insert into public.objective_step_results(
    attempt_id,run_id,objective_id,user_id,status,output,output_hash,
    started_at,completed_at
) values (
    'f1000000-0000-4000-8000-000000000070',
    'f1000000-0000-4000-8000-000000000060',
    'f1000000-0000-4000-8000-000000000010',
    'f1111111-1111-4111-8111-111111111111','succeeded','{"ok":true}',
    '4444444444444444',now(),now()
);
select throws_ok($$update public.objective_runs
    set status='succeeded',completed_at=now()
    where id='f1000000-0000-4000-8000-000000000060'$$,
    'P0001',null,'invalid run transitions are rejected');
select throws_ok($$update public.objective_step_results set output='{"ok":false}'$$,
    'P0001',null,'completed step evidence is append-only');

insert into public.objective_policy_decisions(
    id,objective_id,plan_id,step_id,budget_id,user_id,risk_class,
    payload_hash,policy_version,consent_snapshot_hash,
    connection_snapshot_hash,budget_snapshot_hash,delegation_snapshot_hash,
    allowlist_snapshot_hash,decision,requires_approval,expires_at
) values (
    'f1000000-0000-4000-8000-000000000080',
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000040',
    'f1000000-0000-4000-8000-000000000050',
    'f1111111-1111-4111-8111-111111111111','external','5555555555555555',
    'policy-v1','6666666666666666','7777777777777777','8888888888888888',
    '9999999999999999','aaaaaaaaaaaaaaaa',
    'require_approval',true,now()+interval '1 hour'
);
select throws_ok($$insert into public.objective_approvals(
    objective_id,plan_id,step_id,policy_decision_id,user_id,payload,payload_hash,
    payload_version,status,decided_by,decided_payload,decided_payload_hash,
    decided_payload_version,decided_at,expires_at
) values (
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000040',
    'f1000000-0000-4000-8000-000000000080',
    'f1111111-1111-4111-8111-111111111111','{"value":1}',
    '5555555555555555',1,'approved','f1111111-1111-4111-8111-111111111111',
    '{"value":2}','5555555555555555',1,now(),now()+interval '1 hour'
)$$,'23514',null,'approval rejects a payload that differs from the request');
select throws_ok($$insert into public.objective_approvals(
    objective_id,plan_id,step_id,policy_decision_id,user_id,payload,payload_hash,
    payload_version,status,decided_by,decided_at,expires_at
) values (
    'f1000000-0000-4000-8000-000000000010',
    'f1000000-0000-4000-8000-000000000030',
    'f1000000-0000-4000-8000-000000000040',
    'f1000000-0000-4000-8000-000000000080',
    'f1111111-1111-4111-8111-111111111111','{"value":1}',
    '5555555555555555',2,'denied','f2222222-2222-4222-8222-222222222222',
    now(),now()+interval '1 hour'
)$$,'23514',null,'approval cannot reference a cross-tenant decider');
reset role;

select * from finish();
rollback;
