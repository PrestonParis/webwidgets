begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('91111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','automation-one@example.invalid'),
('92222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','automation-two@example.invalid');

set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_v1_task_automation('Daily fixture','Review priorities','Fixture notes','09:00','UTC')$$,
    'owner creates the typed V1 task automation');
reset role;
select set_config('test.automation_config',(select id::text from public.automation_configs
    where user_id='91111111-1111-4111-8111-111111111111' and definition_id='v1.create-task'),true);

set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.trigger_v1_task_automation(%L,%L,true)',
    current_setting('test.automation_config'),'dry-run-1'),'draft automation supports an explicit dry run');
reset role;
select is((select status from public.automation_runs where trigger_key='dry-run-1'),'completed','dry run is terminal');
select is((select count(*) from public.action_requests where automation_run_id=(select id from public.automation_runs
    where trigger_key='dry-run-1')),0::bigint,'dry run never materializes an action');

update public.automation_configs set state='enabled' where id=current_setting('test.automation_config')::uuid;
set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.trigger_v1_task_automation(%L,%L,false)',
    current_setting('test.automation_config'),'schedule:2026-08-30'),'due schedule creates an approval run');
select lives_ok(format('select public.trigger_v1_task_automation(%L,%L,false)',
    current_setting('test.automation_config'),'schedule:2026-08-30'),'restart replay is idempotent');
reset role;
select is((select count(*) from public.automation_runs where trigger_key='schedule:2026-08-30'),1::bigint,
    'duplicate schedule scan creates one run');
select set_config('test.automation_run',(select id::text from public.automation_runs
    where trigger_key='schedule:2026-08-30'),true);
select set_config('test.automation_hash',(select action_payload_hash from public.automation_runs
    where id=current_setting('test.automation_run')::uuid),true);

set local role authenticated;
set local request.jwt.claim.sub='92222222-2222-4222-8222-222222222222';
select throws_ok(format('select public.decide_v1_automation_run(%L,1,%L,%L)',current_setting('test.automation_run'),
    current_setting('test.automation_hash'),'approved'),'P0001','automation_run_forbidden','another user cannot approve the run');
reset role;

insert into public.automation_user_controls(user_id,pause_all)
values('91111111-1111-4111-8111-111111111111',true);
set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select throws_ok(format('select public.decide_v1_automation_run(%L,1,%L,%L)',current_setting('test.automation_run'),
    current_setting('test.automation_hash'),'approved'),'P0001','automation_paused','pause-all blocks approval');
reset role;
update public.automation_user_controls set pause_all=false where user_id='91111111-1111-4111-8111-111111111111';

set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select throws_ok(format('select public.decide_v1_automation_run(%L,2,%L,%L)',current_setting('test.automation_run'),
    current_setting('test.automation_hash'),'approved'),'P0001','automation_approval_stale','stale payload version is rejected');
select lives_ok(format('select public.decide_v1_automation_run(%L,1,%L,%L)',current_setting('test.automation_run'),
    current_setting('test.automation_hash'),'approved'),'exact payload version and hash are approved');
reset role;
select is((select approved_payload from public.action_requests where automation_run_id=current_setting('test.automation_run')::uuid),
    (select action_payload from public.automation_runs where id=current_setting('test.automation_run')::uuid),
    'approval binds an immutable payload copy');

update public.automation_user_controls set pause_all=true where user_id='91111111-1111-4111-8111-111111111111';
select is(public.assert_v1_automation_execution((select id from public.action_requests
    where automation_run_id=current_setting('test.automation_run')::uuid)),false,'pause race is checked immediately before execution');
select is((select status from public.automation_runs where id=current_setting('test.automation_run')::uuid),'cancelled',
    'pause race cancels the queued run');

update public.automation_user_controls set pause_all=false where user_id='91111111-1111-4111-8111-111111111111';
set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.trigger_v1_task_automation(%L,%L,false)',
    current_setting('test.automation_config'),'retry-proof'),'retry proof creates a fresh run');
reset role;
select set_config('test.retry_run',(select id::text from public.automation_runs where trigger_key='retry-proof'),true);
select set_config('test.retry_hash',(select action_payload_hash from public.automation_runs where id=current_setting('test.retry_run')::uuid),true);
set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.decide_v1_automation_run(%L,1,%L,%L)',current_setting('test.retry_run'),
    current_setting('test.retry_hash'),'approved'),'retry proof receives exact approval');
reset role;
insert into public.jobs(id,user_id,type,status,metadata) values
('93333333-3333-4333-8333-333333333333','91111111-1111-4111-8111-111111111111','action.execute','running','{}');
select lives_ok(format('select public.execute_approved_task_action(%L,%L,1)',
    (select id from public.action_requests where automation_run_id=current_setting('test.retry_run')::uuid),
    '93333333-3333-4333-8333-333333333333'),'approved automation executes through the canonical task action');
select lives_ok(format('select public.execute_approved_task_action(%L,%L,2)',
    (select id from public.action_requests where automation_run_id=current_setting('test.retry_run')::uuid),
    '93333333-3333-4333-8333-333333333333'),'worker replay returns the existing verified outcome');
select is((select count(*) from public.todos where source_action_request_id=(select id from public.action_requests
    where automation_run_id=current_setting('test.retry_run')::uuid)),1::bigint,'worker retry never duplicates a completed action');
select is((select status from public.automation_runs where id=current_setting('test.retry_run')::uuid),'completed',
    'verified action outcome completes run history');

set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.trigger_v1_task_automation(%L,%L,false)',
    current_setting('test.automation_config'),'expired-proof'),'expiry proof creates a fresh run');
reset role;
select set_config('test.expired_run',(select id::text from public.automation_runs where trigger_key='expired-proof'),true);
update public.action_requests set expires_at=now()-interval '1 minute'
where automation_run_id=current_setting('test.expired_run')::uuid;
set local role authenticated;
set local request.jwt.claim.sub='91111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.decide_v1_automation_run(%L,1,%L,%L)',current_setting('test.expired_run'),
    (select action_payload_hash from public.automation_runs where id=current_setting('test.expired_run')::uuid),'approved'),
    'expired approval is durably rejected without execution');
reset role;
select is((select approval_state from public.automation_runs where id=current_setting('test.expired_run')::uuid),'expired',
    'expired approval is visible in run history');

insert into public.automation_runs(user_id,automation_config_id,status,approval_state,trigger_key)
values('91111111-1111-4111-8111-111111111111',current_setting('test.automation_config')::uuid,
    'partially_failed',null,'partial-proof');
select is((select status from public.automation_runs where trigger_key='partial-proof'),'partially_failed',
    'partial failure is a valid durable terminal state');

select throws_ok($$insert into public.automation_runs(user_id,status) values
    ('91111111-1111-4111-8111-111111111111','invented_state')$$,'23514',null,'invalid run states are rejected');

set local role authenticated;
set local request.jwt.claim.sub='92222222-2222-4222-8222-222222222222';
select is((select count(*) from public.automation_configs),0::bigint,'automation configs are user scoped');
select is((select count(*) from public.automation_runs),0::bigint,'automation history is user scoped');
select is((select count(*) from public.automation_user_controls),0::bigint,'pause controls are user scoped');
reset role;

select * from finish();
rollback;
