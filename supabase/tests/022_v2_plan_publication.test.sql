begin;
set local search_path=public,extensions;
select no_plan();

select ok(
    has_function_privilege('service_role','public.publish_v2_objective_plan(uuid,uuid,text)','EXECUTE')
    and not has_function_privilege('authenticated','public.publish_v2_objective_plan(uuid,uuid,text)','EXECUTE'),
    'only the service role can publish a validated V2 plan'
);

insert into auth.users(id,instance_id,aud,role,email) values
('e1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','plan-publication@example.invalid');
insert into public.objectives(id,user_id,client_request_key,title,maturity_level,status,submitted_at)
values ('e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
    'plan-publication','Publish a plan',2,'submitted',now());
insert into public.objective_versions(
    id,objective_id,user_id,version,intent,permitted_capabilities,policy_version,
    content_hash
) values ('e1000000-0000-4000-8000-000000000020','e1000000-0000-4000-8000-000000000010',
    'e1111111-1111-4111-8111-111111111111',1,'Publish a bounded plan',
    '["tasks.create@1"]','v2.policy.1',repeat('1',64));
insert into public.objective_plans(
    id,objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,graph_hash
) values
('e1000000-0000-4000-8000-000000000030','e1000000-0000-4000-8000-000000000010',
 'e1000000-0000-4000-8000-000000000020','e1111111-1111-4111-8111-111111111111',
 1,2,'planner-v1','registry-v1',repeat('2',64)),
('e1000000-0000-4000-8000-000000000031','e1000000-0000-4000-8000-000000000010',
 'e1000000-0000-4000-8000-000000000020','e1111111-1111-4111-8111-111111111111',
 2,2,'planner-v1','registry-v1',repeat('3',64)),
('e1000000-0000-4000-8000-000000000032','e1000000-0000-4000-8000-000000000010',
 'e1000000-0000-4000-8000-000000000020','e1111111-1111-4111-8111-111111111111',
 3,2,'planner-v1','registry-v1',repeat('4',64)),
('e1000000-0000-4000-8000-000000000033','e1000000-0000-4000-8000-000000000010',
 'e1000000-0000-4000-8000-000000000020','e1111111-1111-4111-8111-111111111111',
 4,2,'planner-v1','registry-v1',repeat('5',64)),
('e1000000-0000-4000-8000-000000000034','e1000000-0000-4000-8000-000000000010',
 'e1000000-0000-4000-8000-000000000020','e1111111-1111-4111-8111-111111111111',
 5,2,'planner-v1','registry-v1',repeat('6',64));

insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input,input_hash,timeout_seconds,idempotency_scope
) values
('e1000000-0000-4000-8000-000000000040','e1000000-0000-4000-8000-000000000030',
 'e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
 'first',0,'tasks.create','1','reversible_write','{"title":"First"}',repeat('6',64),30,'step'),
('e1000000-0000-4000-8000-000000000041','e1000000-0000-4000-8000-000000000030',
 'e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
 'second',1,'tasks.create','1','reversible_write','{"title":"Second"}',repeat('7',64),30,'step'),
('e1000000-0000-4000-8000-000000000042','e1000000-0000-4000-8000-000000000032',
 'e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
 'cycle-a',0,'tasks.create','1','reversible_write','{"title":"A"}',repeat('8',64),30,'step'),
('e1000000-0000-4000-8000-000000000043','e1000000-0000-4000-8000-000000000032',
 'e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
 'cycle-b',1,'tasks.create','1','reversible_write','{"title":"B"}',repeat('9',64),30,'step'),
('e1000000-0000-4000-8000-000000000044','e1000000-0000-4000-8000-000000000033',
 'e1000000-0000-4000-8000-000000000010','e1111111-1111-4111-8111-111111111111',
 'gap',2,'tasks.create','1','reversible_write','{"title":"Gap"}',repeat('a',64),30,'step');
insert into public.objective_plan_steps(
    id,plan_id,objective_id,user_id,step_key,position,capability_name,
    capability_version,risk_class,input,input_hash,timeout_seconds,idempotency_scope
)
select format(
        'e2000000-0000-4000-8000-%s',lpad(to_hex(position),12,'0')
    )::uuid,
    'e1000000-0000-4000-8000-000000000034',
    'e1000000-0000-4000-8000-000000000010',
    'e1111111-1111-4111-8111-111111111111',
    'dense-' || position,position,'tasks.create','1','reversible_write',
    jsonb_build_object('title','Dense ' || position),repeat('b',64),30,'step'
from generate_series(0,99) position;
insert into public.objective_step_dependencies(
    plan_id,objective_id,user_id,step_id,depends_on_step_id
) values
('e1000000-0000-4000-8000-000000000030','e1000000-0000-4000-8000-000000000010',
 'e1111111-1111-4111-8111-111111111111','e1000000-0000-4000-8000-000000000041',
 'e1000000-0000-4000-8000-000000000040'),
('e1000000-0000-4000-8000-000000000032','e1000000-0000-4000-8000-000000000010',
 'e1111111-1111-4111-8111-111111111111','e1000000-0000-4000-8000-000000000042',
 'e1000000-0000-4000-8000-000000000043'),
('e1000000-0000-4000-8000-000000000032','e1000000-0000-4000-8000-000000000010',
 'e1111111-1111-4111-8111-111111111111','e1000000-0000-4000-8000-000000000043',
 'e1000000-0000-4000-8000-000000000042');
insert into public.objective_step_dependencies(
    plan_id,objective_id,user_id,step_id,depends_on_step_id
)
select 'e1000000-0000-4000-8000-000000000034',
    'e1000000-0000-4000-8000-000000000010',
    'e1111111-1111-4111-8111-111111111111',
    format('e2000000-0000-4000-8000-%s',lpad(to_hex(current_position),12,'0'))::uuid,
    format('e2000000-0000-4000-8000-%s',lpad(to_hex(prior_position),12,'0'))::uuid
from generate_series(1,99) current_position
cross join lateral generate_series(
    greatest(0,current_position-4),current_position-1
) prior_position;

select ok(
    (select graph_hash like 'dirty:%' from public.objective_plans
     where id='e1000000-0000-4000-8000-000000000030'),
    'graph writes invalidate the previously stored canonical hash'
);
update public.objective_plans set graph_hash=case id
    when 'e1000000-0000-4000-8000-000000000030' then repeat('2',64)
    when 'e1000000-0000-4000-8000-000000000031' then repeat('3',64)
    when 'e1000000-0000-4000-8000-000000000032' then repeat('4',64)
    when 'e1000000-0000-4000-8000-000000000033' then repeat('5',64)
    when 'e1000000-0000-4000-8000-000000000034' then repeat('6',64)
end
where id in (
    'e1000000-0000-4000-8000-000000000030',
    'e1000000-0000-4000-8000-000000000031',
    'e1000000-0000-4000-8000-000000000032',
    'e1000000-0000-4000-8000-000000000033',
    'e1000000-0000-4000-8000-000000000034'
);
update public.objective_plans set budget_snapshot='{"maxAttempts":4}'
where id='e1000000-0000-4000-8000-000000000031';
select ok(
    (select graph_hash like 'dirty:%' from public.objective_plans
     where id='e1000000-0000-4000-8000-000000000031'),
    'plan-root definition writes invalidate the canonical hash'
);
update public.objective_plans set graph_hash=repeat('3',64)
where id='e1000000-0000-4000-8000-000000000031';

set local role service_role;
select throws_ok(
    $$select public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000031',
        'e1111111-1111-4111-8111-111111111111',repeat('3',64))$$,
    'P0001',null,'empty plans cannot publish'
);
select throws_ok(
    $$select public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000032',
        'e1111111-1111-4111-8111-111111111111',repeat('4',64))$$,
    'P0001',null,'cyclic plans cannot publish'
);
select throws_ok(
    $$select public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000033',
        'e1111111-1111-4111-8111-111111111111',repeat('5',64))$$,
    'P0001',null,'non-contiguous plan positions cannot publish'
);
select throws_ok(
    $$select public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000030',
        'e1111111-1111-4111-8111-111111111111',repeat('f',64))$$,
    'P0001',null,'a stale graph hash cannot publish'
);
select is(
    (public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000030',
        'e1111111-1111-4111-8111-111111111111',repeat('2',64)))->>'status',
    'published','a valid draft plan publishes atomically'
);
select ok(
    (select published_at is not null from public.objective_versions
     where id='e1000000-0000-4000-8000-000000000020'),
    'publication freezes the objective version in the same transaction'
);
select is(
    (public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000030',
        'e1111111-1111-4111-8111-111111111111',repeat('2',64)))->>'reused',
    'true','same-graph publication is idempotent'
);
select is(
    (public.publish_v2_objective_plan(
        'e1000000-0000-4000-8000-000000000034',
        'e1111111-1111-4111-8111-111111111111',repeat('6',64)))->>'status',
    'published','a dense bounded DAG publishes without path enumeration'
);
reset role;

delete from public.objective_plans
where id='e1000000-0000-4000-8000-000000000033';
select ok(
    not exists (
        select 1 from public.objective_plans
        where id='e1000000-0000-4000-8000-000000000033'
    ),
    'draft plan deletion still cascades through graph children'
);

select * from finish();
rollback;
