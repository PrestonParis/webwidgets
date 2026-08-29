begin;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id,instance_id,aud,role,email) values
('31111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mail-one@example.invalid'),
('32222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mail-two@example.invalid');
select public.store_verified_provider_credentials('31111111-1111-4111-8111-111111111111','google','mail-one@example.invalid','fixture-subject',array['gmail.readonly','gmail.compose'],'fixture-token','fixture-refresh',2000000000000);
select set_config('test.email_account',(select id::text from public.user_email_accounts where email='mail-one@example.invalid'),true);
insert into public.action_requests(id,user_id,action_id,payload,payload_hash,payload_version,approval_state,status,policy_version,permission_snapshot_hash,expires_at)
values ('33333333-3333-4333-8333-333333333333','31111111-1111-4111-8111-111111111111','email.send',
jsonb_build_object('provider','google','accountId',current_setting('test.email_account'),'from','mail-one@example.invalid','to',jsonb_build_array('recipient@example.invalid'),'cc','[]'::jsonb,'bcc','[]'::jsonb,'subject','Fixture','body','Fixture only','reply',null),
repeat('a',64),1,'required','pending','email-actions-v1','pending',now()+interval '1 day');
select set_config('test.email_payload',(select payload::text from public.action_requests where id='33333333-3333-4333-8333-333333333333'),true);
insert into public.jobs(id,user_id,type,status,metadata) values
('34444444-4444-4444-8444-444444444444','31111111-1111-4111-8111-111111111111','action.execute','queued',jsonb_build_object('task',jsonb_build_object('actionRequestId','33333333-3333-4333-8333-333333333333'))),
('35555555-5555-4555-8555-555555555555','32222222-2222-4222-8222-222222222222','action.execute','queued',jsonb_build_object('task',jsonb_build_object('actionRequestId','33333333-3333-4333-8333-333333333333')));

select ok(not has_table_privilege('authenticated','public.email_action_dispatches','INSERT'),'browser cannot reserve dispatch');
select ok(not has_function_privilege('authenticated','public.claim_email_action(uuid,uuid)','EXECUTE'),'browser cannot claim execution');
select ok(not has_function_privilege('authenticated','public.checkpoint_email_action(uuid,uuid,text,text)','EXECUTE'),'browser cannot forge an Outlook dispatch checkpoint');
select ok(not has_function_privilege('anon','public.approve_email_action(uuid,text,jsonb,text,integer,text)','EXECUTE'),'anonymous approval denied');
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_action_stale_approval','unapproved send cannot dispatch');

set local role authenticated;
set local request.jwt.claim.sub = '32222222-2222-4222-8222-222222222222';
select throws_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb,repeat('a',64),1,'approved')$$,'P0001','email_action_forbidden','other user cannot approve');
set local request.jwt.claim.sub = '31111111-1111-4111-8111-111111111111';
select throws_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.draft',current_setting('test.email_payload')::jsonb,repeat('a',64),1,'approved')$$,'P0001','email_action_stale_approval','draft approval cannot authorize send');
select throws_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb || '{"body":"changed"}',repeat('a',64),1,'approved')$$,'P0001','email_action_stale_approval','changed body invalidates approval');
select throws_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb,repeat('b',64),1,'approved')$$,'P0001','email_action_stale_approval','stale hash rejected');
select throws_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb,repeat('a',64),2,'approved')$$,'P0001','email_action_stale_approval','stale version rejected');
select lives_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb,repeat('a',64),1,'approved')$$,'owner approves exact message');
select lives_ok($$select public.approve_email_action('33333333-3333-4333-8333-333333333333','email.send',current_setting('test.email_payload')::jsonb,repeat('a',64),1,'approved')$$,'double approval is idempotent');
reset role;
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','35555555-5555-4555-8555-555555555555')$$,'P0001','email_action_stale_approval','cross-user queue job rejected');
update public.action_requests set status='cancelled' where id='33333333-3333-4333-8333-333333333333';
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_action_stale_approval','cancelled request cannot dispatch');
update public.action_requests set status='queued',expires_at=now()-interval '1 second' where id='33333333-3333-4333-8333-333333333333';
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_action_stale_approval','expired approval cannot dispatch');
update public.action_requests set expires_at=now()+interval '1 day', permission_snapshot_hash='generic-approval' where id='33333333-3333-4333-8333-333333333333';
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_action_stale_approval','generic approval cannot substitute for explicit email review');
update public.action_requests set permission_snapshot_hash=concat('email-explicit:',id,':',payload_hash) where id='33333333-3333-4333-8333-333333333333';
select is(public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')->>'dispatchAllowed','true','first claim permits one provider call');
select is(public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')->>'dispatchAllowed','false','duplicate delivery may reconcile only');
select lives_ok($$select public.checkpoint_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','prepared','immutable-draft')$$,'Outlook draft identity can be durably checkpointed');
select lives_ok($$select public.checkpoint_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','dispatching','immutable-draft')$$,'send intent is checkpointed before provider call');
update public.email_action_dispatches set state='unknown'
where action_request_id='33333333-3333-4333-8333-333333333333';
select is(public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')->>'dispatchAllowed','false','ambiguous outcome cannot be resent');
select ok(not has_function_privilege('authenticated','public.propose_email_action(uuid,text,jsonb,text,uuid)','EXECUTE'),'browser cannot forge a proposal hash');
select ok(not has_function_privilege('authenticated','public.record_email_action_outcome(uuid,uuid,jsonb)','EXECUTE'),'browser cannot forge a provider receipt');
select lives_ok($$select public.propose_email_action('31111111-1111-4111-8111-111111111111','email.draft',current_setting('test.email_payload')::jsonb,repeat('b',64),'36666666-6666-4666-8666-666666666666')$$,'validated service proposal creates a pending request');
select lives_ok($$select public.propose_email_action('31111111-1111-4111-8111-111111111111','email.draft',current_setting('test.email_payload')::jsonb,repeat('b',64),'36666666-6666-4666-8666-666666666666')$$,'proposal retry is idempotent');
select is((select count(*) from public.action_requests where user_id='31111111-1111-4111-8111-111111111111'),2::bigint,'proposal retry creates no second request');
select throws_ok($$select public.propose_email_action('31111111-1111-4111-8111-111111111111','email.send',current_setting('test.email_payload')::jsonb,repeat('b',64),'36666666-6666-4666-8666-666666666666')$$,'P0001','email_idempotency_conflict','same proposal key cannot change draft to send');
select throws_ok($$select public.record_email_action_outcome('33333333-3333-4333-8333-333333333333','35555555-5555-4555-8555-555555555555','{"state":"unknown"}')$$,'P0001','email_outcome_forbidden','wrong-owner job cannot record a result');
select is(public.record_email_action_outcome('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','{"state":"unknown","providerObjectId":"fixture-message"}')->>'state','unknown','uncertain result stays unknown');
select is((select status from public.action_requests where id='33333333-3333-4333-8333-333333333333'),'deferred','unknown result is not success or failure');
update public.action_requests set expires_at=now()-interval '1 second' where id='33333333-3333-4333-8333-333333333333';
select is(public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')->>'dispatchAllowed','false','expired approval still permits read-only reconciliation');
select throws_ok($$select public.record_email_action_outcome('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','{"state":"verified"}')$$,'P0001','email_receipt_invalid','success requires concrete provider identifiers');
select is(public.record_email_action_outcome('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','{"state":"verified","providerObjectId":"fixture-message","providerMessageId":"fixture-message","threadId":"fixture-thread","body":"must not persist"}')->>'state','verified','verified provider result finalizes the action');
select is(public.record_email_action_outcome('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444','{"state":"unknown"}')->>'state','verified','late uncertain result cannot downgrade verified success');
select ok(not (select receipt ? 'body' from public.email_action_dispatches where action_request_id='33333333-3333-4333-8333-333333333333'),'receipt excludes raw message bodies');
select is((select count(*) from public.action_results where action_request_id='33333333-3333-4333-8333-333333333333'),1::bigint,'reconciliation updates one canonical result');
update public.user_email_accounts set granted_scopes=array['gmail.readonly'] where id=current_setting('test.email_account')::uuid;
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_permission_upgrade_required','revoked grant blocks execution');
update public.user_email_accounts set granted_scopes=array['gmail.readonly','gmail.compose'] where id=current_setting('test.email_account')::uuid;
update public.integration_connections set disabled_at=now() where user_id='31111111-1111-4111-8111-111111111111';
select throws_ok($$select public.claim_email_action('33333333-3333-4333-8333-333333333333','34444444-4444-4444-8444-444444444444')$$,'P0001','email_account_unavailable','disconnect or pause blocks execution');
set local role authenticated;
set local request.jwt.claim.sub = '32222222-2222-4222-8222-222222222222';
select is((select count(*) from public.email_action_dispatches),0::bigint,'dispatch history is owner-scoped');
set local request.jwt.claim.sub = '31111111-1111-4111-8111-111111111111';
select is((select count(*) from public.email_action_dispatches),1::bigint,'owner sees own dispatch history');
select is(public.disconnect_provider_connection((select id from public.integration_connections where user_id=auth.uid())),true,'dispatch history does not prevent disconnect');
select is((select count(*) from public.email_action_dispatches),1::bigint,'disconnect preserves idempotency history');
reset role;
select public.store_verified_provider_credentials('31111111-1111-4111-8111-111111111111','microsoft','mail-ms@example.invalid','fixture-ms-subject',array['Mail.ReadWrite'],'fixture-token',null,2000000000000);
select set_config('test.microsoft_payload',jsonb_build_object('provider','microsoft','accountId',(select id::text from public.user_email_accounts where email='mail-ms@example.invalid'),'from','mail-ms@example.invalid')::text,true);
select lives_ok($$select public.assert_email_action_account('31111111-1111-4111-8111-111111111111','email.draft',current_setting('test.microsoft_payload')::jsonb)$$,'Outlook draft accepts Mail.ReadWrite');
select throws_ok($$select public.assert_email_action_account('31111111-1111-4111-8111-111111111111','email.send',current_setting('test.microsoft_payload')::jsonb)$$,'P0001','email_permission_upgrade_required','Outlook send needs separate Mail.Send');
update public.user_email_accounts set granted_scopes=array['Mail.ReadWrite','Mail.Send'] where email='mail-ms@example.invalid';
select lives_ok($$select public.assert_email_action_account('31111111-1111-4111-8111-111111111111','email.send',current_setting('test.microsoft_payload')::jsonb)$$,'Outlook send accepts explicit Mail.Send');
select throws_ok($$select public.assert_email_action_account('31111111-1111-4111-8111-111111111111','email.send',current_setting('test.microsoft_payload')::jsonb || '{"from":"other@example.invalid"}')$$,'P0001','email_account_unavailable','approved sender must match the exact account');
select throws_ok($$select public.assert_email_action_account('32222222-2222-4222-8222-222222222222','email.send',current_setting('test.microsoft_payload')::jsonb)$$,'P0001','email_account_forbidden','another user cannot use the selected account');
select * from finish();
rollback;
