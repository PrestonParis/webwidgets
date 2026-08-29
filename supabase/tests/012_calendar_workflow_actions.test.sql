begin;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,instance_id,aud,role,email) values
('81111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','provider-one@example.invalid'),
('82222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','provider-two@example.invalid');
select public.store_verified_provider_credentials('81111111-1111-4111-8111-111111111111','google','provider-one@example.invalid',
    'fixture-provider-subject',array['gmail.readonly','calendar.events'],'fixture-token','fixture-refresh',2000000000000);
select set_config('test.calendar_account',(select id::text from public.user_email_accounts where user_id='81111111-1111-4111-8111-111111111111'),true);
select set_config('test.calendar_payload',jsonb_build_object('provider','google','accountId',current_setting('test.calendar_account'),
    'calendarId','primary','title','Fixture event','description','Fixture','location',null,'attendees',jsonb_build_array('guest@example.invalid'),
    'allDay',false,'startsAt','2026-09-01T13:00:00.000Z','endsAt','2026-09-01T14:00:00.000Z','timezone','America/New_York')::text,true);
select lives_ok($$select public.propose_calendar_action('81111111-1111-4111-8111-111111111111',current_setting('test.calendar_payload')::jsonb,
    repeat('c',64),'83333333-3333-4333-8333-333333333333')$$,'calendar proposal uses exact configured account');
select set_config('test.calendar_request',(select id::text from public.action_requests where idempotency_key='calendar:83333333-3333-4333-8333-333333333333'),true);
insert into public.jobs(id,user_id,type,status,metadata) values('84444444-4444-4444-8444-444444444444','81111111-1111-4111-8111-111111111111',
    'action.execute','queued',jsonb_build_object('task',jsonb_build_object('actionRequestId',current_setting('test.calendar_request'))));
select ok(not has_function_privilege('authenticated','public.claim_calendar_action(uuid,uuid)','EXECUTE'),'browser cannot claim calendar dispatch');
set local role authenticated;set local request.jwt.claim.sub='82222222-2222-4222-8222-222222222222';
select throws_ok(format('select public.approve_calendar_action(%L,%L::jsonb,%L,1,%L)',current_setting('test.calendar_request'),
    current_setting('test.calendar_payload'),repeat('c',64),'approved'),'P0001','calendar_action_forbidden','other user cannot approve calendar event');
set local request.jwt.claim.sub='81111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.approve_calendar_action(%L,%L::jsonb,%L,1,%L)',current_setting('test.calendar_request'),
    current_setting('test.calendar_payload'),repeat('c',64),'approved'),'owner approves exact calendar event');reset role;
select is(public.claim_calendar_action(current_setting('test.calendar_request')::uuid,'84444444-4444-4444-8444-444444444444')->>'dispatchAllowed','true','calendar provider call reserved once');
select is(public.claim_calendar_action(current_setting('test.calendar_request')::uuid,'84444444-4444-4444-8444-444444444444')->>'dispatchAllowed','false','calendar retry can only reconcile');
select throws_ok(format('select public.record_calendar_action_outcome(%L,%L,%L::jsonb)',current_setting('test.calendar_request'),
    '84444444-4444-4444-8444-444444444444','{"state":"verified"}'),'P0001','calendar_receipt_invalid','calendar success needs verified fields');
select lives_ok(format('select public.record_calendar_action_outcome(%L,%L,%L::jsonb)',current_setting('test.calendar_request'),
    '84444444-4444-4444-8444-444444444444','{"state":"verified","providerObjectId":"fixture-event","htmlLink":"https://calendar.invalid/event","start":"2026-09-01T13:00:00Z","end":"2026-09-01T14:00:00Z"}'),'verified calendar receipt finalizes request');
set local role authenticated;set local request.jwt.claim.sub='81111111-1111-4111-8111-111111111111';
select is(public.begin_calendar_action_undo(current_setting('test.calendar_request')::uuid)->>'eventId','fixture-event','owner begins explicit cancellation');reset role;
select lives_ok(format('select public.record_calendar_action_undo(%L,%L,true)',current_setting('test.calendar_request'),
    '81111111-1111-4111-8111-111111111111'),'verified delete completes cancellation');
select is((select undo_status from public.action_results where action_request_id=current_setting('test.calendar_request')::uuid),'completed','canonical result records cancellation');

insert into public.automation_configs(id,user_id,name,trigger_type,state,requires_approval,config)
values('85555555-5555-4555-8555-555555555555','81111111-1111-4111-8111-111111111111','Weekly fixture','manual','enabled',true,'{"workflowKey":"weekly_summary"}');
select set_config('test.workflow_payload','{"automationConfigId":"85555555-5555-4555-8555-555555555555","workflowKey":"weekly_summary","parameters":{"weekOf":"2026-08-24"}}',true);
select lives_ok($$select public.propose_workflow_action('81111111-1111-4111-8111-111111111111',current_setting('test.workflow_payload')::jsonb,
    repeat('d',64),'86666666-6666-4666-8666-666666666666')$$,'configured allowlisted workflow can be proposed');
select set_config('test.workflow_request',(select id::text from public.action_requests where idempotency_key='workflow:86666666-6666-4666-8666-666666666666'),true);
insert into public.jobs(id,user_id,type,status,metadata) values('87777777-7777-4777-8777-777777777777','81111111-1111-4111-8111-111111111111',
    'action.execute','queued',jsonb_build_object('task',jsonb_build_object('actionRequestId',current_setting('test.workflow_request'))));
set local role authenticated;set local request.jwt.claim.sub='81111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.approve_workflow_action(%L,%L::jsonb,%L,1,%L)',current_setting('test.workflow_request'),
    current_setting('test.workflow_payload'),repeat('d',64),'approved'),'owner approves exact workflow parameters');reset role;
select is(public.claim_workflow_action(current_setting('test.workflow_request')::uuid,'87777777-7777-4777-8777-777777777777')->>'dispatchAllowed','true','workflow dispatch reserved once');
select lives_ok(format('select public.record_workflow_dispatch(%L,%L,%L::jsonb)',current_setting('test.workflow_request'),
    '87777777-7777-4777-8777-777777777777','{"state":"accepted","providerObjectId":"n8n-run-1"}'),'n8n acceptance records correlated run id');
select throws_ok(format('select public.record_workflow_callback(%L,%L,%L,%L,%L,%L,%L,%L::jsonb)','callback-bad',
    '81111111-1111-4111-8111-111111111111',current_setting('test.workflow_request'),'87777777-7777-4777-8777-777777777777',
    'wrong-key','n8n-run-1','completed','{}'),'P0001','workflow_callback_forbidden','callback must match canonical idempotency key');
select is(public.record_workflow_callback('callback-good','81111111-1111-4111-8111-111111111111',current_setting('test.workflow_request')::uuid,
    '87777777-7777-4777-8777-777777777777','workflow:86666666-6666-4666-8666-666666666666','n8n-run-1','completed','{"output":"fixture"}'),true,'verified workflow callback completes action');
select is(public.record_workflow_callback('callback-good','81111111-1111-4111-8111-111111111111',current_setting('test.workflow_request')::uuid,
    '87777777-7777-4777-8777-777777777777','workflow:86666666-6666-4666-8666-666666666666','n8n-run-1','completed','{"output":"fixture"}'),false,'callback replay is idempotently ignored');
select is((select status from public.automation_runs where id=(select automation_run_id from public.action_requests
    where id=current_setting('test.workflow_request')::uuid)),'completed','callback finalizes canonical automation run');
select is((select status from public.action_requests where id=current_setting('test.workflow_request')::uuid),'completed','callback finalizes canonical action');
select set_config('test.unknown_workflow_payload','{"automationConfigId":"85555555-5555-4555-8555-555555555555","workflowKey":"weekly_summary","parameters":{"weekOf":"2026-08-31"}}',true);
select lives_ok($$select public.propose_workflow_action('81111111-1111-4111-8111-111111111111',current_setting('test.unknown_workflow_payload')::jsonb,
    repeat('e',64),'88888888-8888-4888-8888-888888888888')$$,'second workflow can exercise ambiguous provider response');
select set_config('test.unknown_workflow_request',(select id::text from public.action_requests where idempotency_key='workflow:88888888-8888-4888-8888-888888888888'),true);
insert into public.jobs(id,user_id,type,status,metadata) values('89999999-9999-4999-8999-999999999999','81111111-1111-4111-8111-111111111111',
    'action.execute','queued',jsonb_build_object('task',jsonb_build_object('actionRequestId',current_setting('test.unknown_workflow_request'))));
set local role authenticated;set local request.jwt.claim.sub='81111111-1111-4111-8111-111111111111';
select lives_ok(format('select public.approve_workflow_action(%L,%L::jsonb,%L,1,%L)',current_setting('test.unknown_workflow_request'),
    current_setting('test.unknown_workflow_payload'),repeat('e',64),'approved'),'owner approves second exact workflow');reset role;
select is(public.claim_workflow_action(current_setting('test.unknown_workflow_request')::uuid,'89999999-9999-4999-8999-999999999999')->>'dispatchAllowed','true','ambiguous workflow dispatch reserved once');
select lives_ok(format('select public.record_workflow_dispatch(%L,%L,%L::jsonb)',current_setting('test.unknown_workflow_request'),
    '89999999-9999-4999-8999-999999999999','{"state":"unknown","providerObjectId":null}'),'ambiguous n8n response is recorded without retry');
select is(public.record_workflow_callback('callback-unknown','81111111-1111-4111-8111-111111111111',current_setting('test.unknown_workflow_request')::uuid,
    '89999999-9999-4999-8999-999999999999','workflow:88888888-8888-4888-8888-888888888888','n8n-run-late','completed','{"output":"late callback"}'),true,'signed callback reconciles ambiguous provider response');
select is((select provider_object_id from public.workflow_action_dispatches where action_request_id=current_setting('test.unknown_workflow_request')::uuid),'n8n-run-late','callback binds provider run id after ambiguous response');
set local role authenticated;set local request.jwt.claim.sub='82222222-2222-4222-8222-222222222222';
select is((select count(*) from public.calendar_action_dispatches),0::bigint,'calendar dispatches are owner scoped');
select is((select count(*) from public.workflow_action_dispatches),0::bigint,'workflow dispatches are owner scoped');reset role;
select * from finish();rollback;
