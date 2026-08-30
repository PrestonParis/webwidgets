begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('c1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','operations@example.invalid');

insert into public.jobs(id,user_id,type,status,idempotency_key,queue_name,
    failure_detail,created_at,updated_at)
values
('c2222222-2222-4222-8222-222222222222','c1111111-1111-4111-8111-111111111111',
 'rss.fetch','queued','operations-queued','v1-ingestion','private-source-body',
 now()-interval '3 minutes',now()),
('c3333333-3333-4333-8333-333333333333','c1111111-1111-4111-8111-111111111111',
 'rss.fetch','dead_lettered','operations-dead','v1-ingestion','private-provider-token',
 now()-interval '5 minutes',now());
update public.jobs set dead_lettered_at=now()
where id='c3333333-3333-4333-8333-333333333333';

set local role service_role;
insert into public.worker_runtime_heartbeats(instance_id,release_id,ready,
    redis_ready,supabase_ready,seen_at)
values('operations-worker','release-fixture',true,true,true,now());
select lives_ok($$select public.get_v1_operations_snapshot()$$,
    'service role reads the content-free operational snapshot');
select is((public.get_v1_operations_snapshot()#>>'{worker,healthy}')::boolean,
    true,'fresh dependency-ready heartbeat is healthy');
select is((public.get_v1_operations_snapshot()#>>'{jobs,queue_depth}')::bigint,
    1::bigint,'queued canonical work is measured');
select is((public.get_v1_operations_snapshot()#>>'{jobs,dead_letters_24h}')::bigint,
    1::bigint,'dead letters are measured');
select ok((public.get_v1_operations_snapshot()#>>'{jobs,oldest_queue_age_seconds}')::bigint >= 180,
    'oldest queue age is measurable');
select ok(public.get_v1_operations_snapshot()::text not like '%private-source-body%'
    and public.get_v1_operations_snapshot()::text not like '%private-provider-token%',
    'operations telemetry excludes private job diagnostics');
update public.worker_runtime_heartbeats set seen_at=now()-interval '2 minutes'
where instance_id='operations-worker';
select is((public.get_v1_operations_snapshot()#>>'{worker,healthy}')::boolean,
    false,'stale worker heartbeats become degraded without false success');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='c1111111-1111-4111-8111-111111111111';
select throws_ok($$select count(*) from public.worker_runtime_heartbeats$$,
    '42501',null,'worker presence is not exposed through RLS');
select ok(not has_function_privilege('authenticated',
    'public.get_v1_operations_snapshot()','EXECUTE'),
    'authenticated users cannot execute the global operations snapshot');
reset role;

select ok(not has_table_privilege('anon','public.worker_runtime_heartbeats','SELECT')
    and not has_table_privilege('authenticated','public.worker_runtime_heartbeats','SELECT'),
    'heartbeat storage has no anonymous or authenticated table grants');

select * from finish();
rollback;
