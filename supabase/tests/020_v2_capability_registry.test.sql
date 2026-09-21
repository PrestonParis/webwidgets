begin;
set local search_path=public,extensions;
select no_plan();

select ok(
    (select relrowsecurity from pg_class
     where oid='public.automation_capability_versions'::regclass),
    'capability versions have RLS enabled'
);
select ok(
    not has_table_privilege('anon','public.automation_capability_versions','SELECT')
    and not has_table_privilege(
        'authenticated','public.automation_capability_versions','SELECT'
    ),
    'browser roles cannot enumerate internal registry records'
);
select ok(
    has_table_privilege(
        'service_role','public.automation_capability_versions','SELECT'
    ) and has_function_privilege(
        'service_role',
        'public.retire_automation_capability_version(text,text)',
        'EXECUTE'
    ),
    'service role can read and retire registry versions'
);
select is(
    (select count(*)::integer from public.automation_capability_versions),
    5,
    'only the five production-backed capabilities are registered'
);
select results_eq(
    $$select name from public.automation_capability_versions order by name$$,
    $$values ('calendar.create_event'),('email.draft'),('tasks.complete'),
        ('tasks.create'),('tasks.update')$$,
    'the registry excludes templates, placeholders, and beta actions'
);

set local role service_role;
select throws_ok(
    $$update public.automation_capability_versions
      set definition_hash=repeat('0',64)
      where name='tasks.create' and version='1'$$,
    'P0001', null, 'registered capability definitions are immutable'
);
select throws_ok(
    $$delete from public.automation_capability_versions
      where name='tasks.update' and version='1'$$,
    'P0001', null, 'registered capability versions cannot be deleted'
);
reset role;

insert into auth.users(id,instance_id,aud,role,email) values
('c1111111-1111-4111-8111-111111111111',
 '00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','registry@example.invalid');
insert into public.objectives(
    id,user_id,client_request_key,title,maturity_level,status
) values (
    'c1000000-0000-4000-8000-000000000010',
    'c1111111-1111-4111-8111-111111111111',
    'registry-request','Create task',2,'draft'
);
insert into public.objective_versions(
    id,objective_id,user_id,version,intent,policy_version,content_hash,published_at
) values (
    'c1000000-0000-4000-8000-000000000020',
    'c1000000-0000-4000-8000-000000000010',
    'c1111111-1111-4111-8111-111111111111',1,
    'Create a bounded task','policy-v1','1111111111111111',now()
);
insert into public.objective_plans(
    id,objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,graph_hash
) values (
    'c1000000-0000-4000-8000-000000000030',
    'c1000000-0000-4000-8000-000000000010',
    'c1000000-0000-4000-8000-000000000020',
    'c1111111-1111-4111-8111-111111111111',1,2,
    'planner-v1','registry-v1','2222222222222222'
);
insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input_hash,timeout_seconds,idempotency_scope
) values (
    'c1000000-0000-4000-8000-000000000040',
    'c1000000-0000-4000-8000-000000000030',
    'c1000000-0000-4000-8000-000000000010',
    'c1111111-1111-4111-8111-111111111111','create-task',0,
    'tasks.create','1','reversible_write','3333333333333333',30,'objective-step'
);
insert into public.objective_plans(
    id,objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,graph_hash
) values (
    'c1000000-0000-4000-8000-000000000031',
    'c1000000-0000-4000-8000-000000000010',
    'c1000000-0000-4000-8000-000000000020',
    'c1111111-1111-4111-8111-111111111111',2,2,
    'planner-v1','registry-v1','2222222222222223'
);
insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input_hash,timeout_seconds,idempotency_scope
) values (
    'c1000000-0000-4000-8000-000000000041',
    'c1000000-0000-4000-8000-000000000031',
    'c1000000-0000-4000-8000-000000000010',
    'c1111111-1111-4111-8111-111111111111','draft-task',0,
    'tasks.create','1','reversible_write','3333333333333334',30,'objective-step'
);
select throws_ok(
    $$insert into public.objective_plan_steps(
        plan_id,objective_id,user_id,step_key,position,capability_name,
        capability_version,risk_class,input_hash,timeout_seconds,idempotency_scope
      ) values (
        'c1000000-0000-4000-8000-000000000030',
        'c1000000-0000-4000-8000-000000000010',
        'c1111111-1111-4111-8111-111111111111','unknown',1,
        'placeholder.action','1','draft','4444444444444444',30,'objective-step'
      )$$,
    'P0001', null, 'plans cannot reference an unregistered capability version'
);
update public.objective_plans set status='published',published_at=now()
where id='c1000000-0000-4000-8000-000000000030';

set local role service_role;
select throws_ok(
    $$select public.retire_automation_capability_version('tasks.create','1')$$,
    'P0001', null, 'published plans on draft objectives prevent retirement'
);
reset role;

update public.objectives
set status='cancelled',completed_at=now(),state_version=2
where id='c1000000-0000-4000-8000-000000000010';
set local role service_role;
select lives_ok(
    $$select public.retire_automation_capability_version('tasks.create','1')$$,
    'a version can retire after its objective becomes terminal'
);
select is(
    (select status from public.automation_capability_versions
     where name='tasks.create' and version='1'),
    'retired','retirement preserves the immutable version record'
);
select throws_ok(
    $$update public.objective_plans
      set status='published',published_at=now()
      where id='c1000000-0000-4000-8000-000000000031'$$,
    'P0001', null, 'draft plans cannot publish after a capability retires'
);
select throws_ok(
    $$insert into public.objective_plan_steps(
        plan_id,objective_id,user_id,step_key,position,capability_name,
        capability_version,risk_class,input_hash,timeout_seconds,idempotency_scope
      ) values (
        'c1000000-0000-4000-8000-000000000030',
        'c1000000-0000-4000-8000-000000000010',
        'c1111111-1111-4111-8111-111111111111','retired',2,
        'tasks.create','1','reversible_write','5555555555555555',30,'objective-step'
      )$$,
    'P0001', null, 'retired versions cannot be added to future plan steps'
);
reset role;

select * from finish();
rollback;
