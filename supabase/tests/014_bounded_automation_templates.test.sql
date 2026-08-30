begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('a1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','templates-one@example.invalid'),
('a2222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','templates-two@example.invalid');

set local role authenticated;
set local request.jwt.claim.sub='a1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_v1_automation_template('v1.commitment-capture','09:00','America/New_York','always',true)$$,'commitment capture is configurable');
select lives_ok($$select public.create_v1_automation_template('v1.daily-briefing','08:30','America/New_York','never',true)$$,'daily briefing is configurable');
select lives_ok($$select public.create_v1_automation_template('v1.calendar-preparation','09:00','America/New_York','always',true)$$,'calendar preparation is configurable');
select lives_ok($$select public.create_v1_automation_template('v1.stale-task-review','10:00','America/New_York','never',true)$$,'stale-task review is configurable');
select throws_ok($$select public.create_v1_automation_template('v1.daily-briefing','08:30','Invalid/Zone','never',true)$$,'P0001','automation_timezone_invalid','invalid timezone is refused');
select throws_ok($$select public.create_v1_automation_template('v1.calendar-preparation','09:00','UTC','never',true)$$,'P0001','automation_approval_unsafe','external calendar writes cannot disable approval');
reset role;

select is((select count(*) from public.automation_configs where user_id='a1111111-1111-4111-8111-111111111111'),4::bigint,'catalog creates one immutable config per template');
select ok((select bool_and(version=1 and config->>'templateVersion'='1') from public.automation_configs where user_id='a1111111-1111-4111-8111-111111111111'),'all configurations preserve template version one');

insert into public.raw_observations(id,user_id,source_type,source_key,provider_object_id,provider_version,event_type,idempotency_key,payload_hash,occurred_at,normalized_at,status)
values('a3000000-0000-4000-8000-000000000001','a1111111-1111-4111-8111-111111111111','gmail','one','one','1','email.received','template-observation',repeat('1',64),now(),now(),'normalized');
insert into public.timeline_events(id,user_id,observation_id,idempotency_key,event_type,source_type,title,content_hash,occurred_at,normalization_version)
values('a4000000-0000-4000-8000-000000000001','a1111111-1111-4111-8111-111111111111','a3000000-0000-4000-8000-000000000001','template-timeline','email.received','gmail','Submit report',repeat('2',64),now(),'test');
insert into public.insights(id,user_id,primary_timeline_event_id,idempotency_key,kind,title,summary,content_hash,model_provider,model_name,model_version,policy_version,confidence,expires_at)
values('a5000000-0000-4000-8000-000000000001','a1111111-1111-4111-8111-111111111111','a4000000-0000-4000-8000-000000000001','template-insight','commitment','Submit report','Dated request',repeat('3',64),'rules','rules','1','candidate-v1',0.9,now()+interval '7 days');
insert into public.candidate_actions(id,user_id,insight_id,idempotency_key,action_id,candidate_kind,payload,payload_hash,policy_version,confidence,reason,extractor_version,expires_at)
values('a6000000-0000-4000-8000-000000000001','a1111111-1111-4111-8111-111111111111','a5000000-0000-4000-8000-000000000001','template-candidate','tasks.create','task','{"title":"Submit report","notes":"From commitment","dueAt":"2026-09-10T17:00:00Z"}',repeat('4',64),'candidate-v1',0.9,'Dated request','rules-v1',now()+interval '7 days');

update public.automation_configs set state='enabled' where user_id='a1111111-1111-4111-8111-111111111111';
select set_config('test.commitment_config',(select id::text from public.automation_configs where definition_id='v1.commitment-capture'),true);
select lives_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.commitment_config'),'candidate:a6000000-0000-4000-8000-000000000001','{"candidateId":"a6000000-0000-4000-8000-000000000001"}','a1111111-1111-4111-8111-111111111111'),'eligible commitment enters canonical approval');
select lives_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.commitment_config'),'candidate:a6000000-0000-4000-8000-000000000001','{"candidateId":"a6000000-0000-4000-8000-000000000001"}','a1111111-1111-4111-8111-111111111111'),'candidate replay is harmless');
select is((select count(*) from public.automation_runs where trigger_key='candidate:a6000000-0000-4000-8000-000000000001'),1::bigint,'commitment candidate creates one run');
select is((select count(*) from public.action_requests where automation_run_id=(select id from public.automation_runs where trigger_key='candidate:a6000000-0000-4000-8000-000000000001')),1::bigint,'commitment candidate creates at most one unified task action');

select set_config('test.briefing_config',(select id::text from public.automation_configs where definition_id='v1.daily-briefing'),true);
select lives_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.briefing_config'),'schedule:2026-08-29','{"coveredFrom":"2026-08-28T12:00:00Z","coveredTo":"2026-08-29T12:00:00Z"}','a1111111-1111-4111-8111-111111111111'),'daily window queues a briefing run');
select lives_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.briefing_config'),'schedule:2026-08-29','{"coveredFrom":"2026-08-28T12:00:00Z","coveredTo":"2026-08-29T12:00:00Z"}','a1111111-1111-4111-8111-111111111111'),'daily schedule replay is harmless');
select is((select count(*) from public.automation_runs where trigger_key='schedule:2026-08-29'),1::bigint,'one local-day window has one briefing run');

insert into public.todos(user_id,text,due_at,completed,updated_at) values
('a1111111-1111-4111-8111-111111111111','Overdue review',now()-interval '1 day',false,now()-interval '20 days'),
('a1111111-1111-4111-8111-111111111111','Current work',now()+interval '2 days',false,now());
select set_config('test.stale_config',(select id::text from public.automation_configs where definition_id='v1.stale-task-review'),true);
select lives_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.stale_config'),'schedule:stale:2026-W35','{}','a1111111-1111-4111-8111-111111111111'),'stale task review completes read-only');
select is((select result->>'reviewOnly' from public.automation_runs where trigger_key='schedule:stale:2026-W35'),'true','stale-task output declares review-only behavior');
select is((select count(*) from public.todos where user_id='a1111111-1111-4111-8111-111111111111' and completed),0::bigint,'stale review completes no tasks');
select is((select count(*) from public.action_requests where automation_run_id=(select id from public.automation_runs where trigger_key='schedule:stale:2026-W35')),0::bigint,'stale review creates no state-changing action');

select set_config('test.calendar_config',(select id::text from public.automation_configs where definition_id='v1.calendar-preparation'),true);
update public.candidate_actions set candidate_kind='calendar',action_id='calendar.create_event',
 payload='{"title":"Ambiguous meeting"}',payload_hash=md5('{"title":"Ambiguous meeting"}'::jsonb::text)
where id='a6000000-0000-4000-8000-000000000001';
update public.candidate_actions set state='approved',approved_payload_hash=payload_hash,
 approved_payload_version=payload_version where id='a6000000-0000-4000-8000-000000000001';
select throws_ok(format('select public.trigger_v1_automation_template(%L,%L,%L::jsonb,false,%L)',current_setting('test.calendar_config'),'calendar:ambiguous','{"candidateId":"a6000000-0000-4000-8000-000000000001"}','a1111111-1111-4111-8111-111111111111'),'P0001','automation_calendar_time_ambiguous','calendar automation refuses ambiguous time data');

set local role authenticated;
set local request.jwt.claim.sub='a2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.automation_configs),0::bigint,'template configs remain user scoped');
select is((select count(*) from public.automation_runs),0::bigint,'template history remains user scoped');
reset role;

select * from finish();
rollback;
