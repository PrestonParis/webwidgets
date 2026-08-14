begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email)
values
    ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-one@example.invalid'),
    ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-two@example.invalid');

insert into public.import_jobs (id, user_id, format, duplicate_strategy)
values
    ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'csv', 'skip'),
    ('10000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'csv', 'skip');
insert into public.export_jobs (id, user_id, title, source_type, format)
values
    ('20000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'One', 'timeline', 'json'),
    ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Two', 'timeline', 'json');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select lives_ok(
    $$insert into public.import_job_logs (import_job_id, message) values ('10000000-0000-4000-8000-000000000001', 'owned')$$,
    'an owner can append an import log'
);
select throws_ok(
    $$insert into public.import_job_logs (import_job_id, message) values ('10000000-0000-4000-8000-000000000002', 'cross-user')$$,
    '42501', null, 'an owner cannot append another user import log'
);
select lives_ok(
    $$insert into public.export_job_logs (export_job_id, message) values ('20000000-0000-4000-8000-000000000001', 'owned')$$,
    'an owner can append an export log'
);
select throws_ok(
    $$insert into public.export_job_logs (export_job_id, message) values ('20000000-0000-4000-8000-000000000002', 'cross-user')$$,
    '42501', null, 'an owner cannot append another user export log'
);
select results_eq(
    $$select count(*)::bigint from public.import_job_logs$$,
    $$values (1::bigint)$$,
    'import logs are filtered through their parent owner'
);
select ok(
    not has_table_privilege('authenticated', 'public.import_job_logs', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.import_job_logs', 'DELETE')
    and not has_table_privilege('authenticated', 'public.export_job_logs', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.export_job_logs', 'DELETE'),
    'authenticated logs are append-only'
);
select ok(
    not has_table_privilege('anon', 'public.import_job_logs', 'SELECT')
    and not has_table_privilege('anon', 'public.export_job_logs', 'SELECT'),
    'anonymous users have no log access'
);

insert into public.raw_observations (
    id, user_id, source_type, source_key, provider_object_id,
    provider_version, event_type, idempotency_key, payload, payload_hash,
    occurred_at, normalized_at, normalization_version, status
) values (
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'rss', 'rss:feed-one', 'article-42', '1', 'article.published',
    'observation:rss:article-42:1', '{"title":"Changed"}', repeat('a', 64),
    '2026-08-14T12:00:00Z', now(), 'rss-v1', 'normalized'
);
select throws_ok(
    $$insert into public.raw_observations (user_id, source_type, source_key, provider_object_id, provider_version, event_type, idempotency_key, payload_hash, occurred_at) values ('11111111-1111-4111-8111-111111111111', 'rss', 'rss:feed-one', 'article-42', '1', 'article.published', 'observation:rss:article-42:1', repeat('b', 64), now())$$,
    '23505', null, 'duplicate observation keys are rejected'
);
select throws_ok(
    $$insert into public.raw_observations (user_id, source_type, source_key, provider_object_id, provider_version, event_type, idempotency_key, payload_hash, occurred_at) values ('22222222-2222-4222-8222-222222222222', 'rss', 'rss:feed-two', 'article-cross', '1', 'article.published', 'observation:rss:article-cross:1', repeat('b', 64), now())$$,
    '42501', null, 'RLS rejects a cross-user observation insert'
);

insert into public.timeline_events (
    id, user_id, observation_id, idempotency_key, event_type, source_type,
    title, content_hash, occurred_at, normalization_version
) values (
    '40000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000001',
    'timeline:rss:article-42', 'article.published', 'rss',
    'A source changed', repeat('c', 64), '2026-08-14T12:00:00Z', 'rss-v1'
);
select results_eq(
    $$select count(*)::bigint from public.timeline_events$$,
    $$values (1::bigint)$$,
    'the owner sees only the owned timeline event'
);

insert into public.insights (
    id, user_id, primary_timeline_event_id, idempotency_key, kind, title,
    summary, content_hash, model_provider, model_name, model_version,
    policy_version, confidence, expires_at
) values (
    '50000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '40000000-0000-4000-8000-000000000001',
    'insight:article-42:v1', 'commitment', 'Deadline changed',
    'The source moved a deadline.', repeat('d', 64), 'test', 'bounded', 'v1',
    'candidate-v1', 0.9, now() + interval '7 days'
);
insert into public.insight_timeline_events (
    user_id, insight_id, timeline_event_id, evidence_role
) values (
    '11111111-1111-4111-8111-111111111111',
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001', 'primary'
);
insert into public.candidate_actions (
    id, user_id, insight_id, idempotency_key, action_id, payload,
    payload_hash, policy_version, confidence, expires_at
) values (
    '60000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '50000000-0000-4000-8000-000000000001',
    'candidate:article-42:task-v1', 'tasks.create', '{"title":"Follow up"}',
    repeat('e', 64), 'candidate-v1', 0.9, now() + interval '7 days'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
insert into public.raw_observations (
    id, user_id, source_type, source_key, provider_object_id,
    provider_version, event_type, idempotency_key, payload_hash,
    occurred_at, normalized_at, normalization_version, status
) values (
    '30000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'rss', 'rss:feed-two', 'article-84', '1', 'article.published',
    'observation:rss:article-84:1', repeat('2', 64),
    '2026-08-14T12:00:00Z', now(), 'rss-v1', 'normalized'
);
insert into public.timeline_events (
    id, user_id, observation_id, idempotency_key, event_type, source_type,
    title, content_hash, occurred_at, normalization_version
) values (
    '40000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '30000000-0000-4000-8000-000000000002',
    'timeline:rss:article-84', 'article.published', 'rss',
    'Another source changed', repeat('3', 64), '2026-08-14T12:00:00Z', 'rss-v1'
);
insert into public.insights (
    id, user_id, primary_timeline_event_id, idempotency_key, kind, title,
    summary, content_hash, model_provider, model_name, model_version,
    policy_version, confidence, expires_at
) values (
    '50000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '40000000-0000-4000-8000-000000000002',
    'insight:article-84:v1', 'commitment', 'Another deadline changed',
    'A second source moved a deadline.', repeat('4', 64), 'test', 'bounded', 'v1',
    'candidate-v1', 0.8, now() + interval '7 days'
);
insert into public.insight_timeline_events (
    user_id, insight_id, timeline_event_id, evidence_role
) values (
    '22222222-2222-4222-8222-222222222222',
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002', 'primary'
);
insert into public.candidate_actions (
    id, user_id, insight_id, idempotency_key, action_id, payload,
    payload_hash, policy_version, confidence, expires_at
) values (
    '60000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '50000000-0000-4000-8000-000000000002',
    'candidate:article-84:task-v1', 'tasks.create', '{"title":"Follow up two"}',
    repeat('5', 64), 'candidate-v1', 0.8, now() + interval '7 days'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select results_eq(
    $$select count(*)::bigint from public.raw_observations$$,
    $$values (1::bigint)$$,
    'raw observations are isolated between two owners'
);
select results_eq(
    $$select count(*)::bigint from public.timeline_events$$,
    $$values (1::bigint)$$,
    'timeline events are isolated between two owners'
);
select results_eq(
    $$select count(*)::bigint from public.insights$$,
    $$values (1::bigint)$$,
    'the owner sees only the owned insight'
);
select results_eq(
    $$select count(*)::bigint from public.insight_timeline_events$$,
    $$values (1::bigint)$$,
    'the owner sees only the owned evidence edge'
);
select results_eq(
    $$select count(*)::bigint from public.candidate_actions$$,
    $$values (1::bigint)$$,
    'the owner sees only the owned candidate'
);

insert into public.action_requests (
    id, user_id, candidate_action_id, idempotency_key, action_id, payload,
    payload_hash, payload_version, policy_version, permission_snapshot_hash
) values (
    '70000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '60000000-0000-4000-8000-000000000001',
    'request:article-42:task-v1', 'tasks.create', '{"title":"Follow up"}',
    repeat('e', 64), 1, 'candidate-v1', repeat('f', 64)
);
select throws_ok(
    $$insert into public.action_requests (user_id, candidate_action_id, idempotency_key, action_id, payload, payload_hash, payload_version, policy_version, permission_snapshot_hash) values ('11111111-1111-4111-8111-111111111111', '60000000-0000-4000-8000-000000000001', 'request:article-42:task-v1', 'tasks.create', '{}', repeat('0', 64), 1, 'candidate-v1', repeat('f', 64))$$,
    '23505', null, 'duplicate execution idempotency keys are rejected'
);
select is(
    (select approval_state from public.decide_action_request(
        '70000000-0000-4000-8000-000000000001', 'approved',
        '{"title":"Follow up"}', repeat('e', 64), 1, repeat('f', 64), now()
    )),
    'approved',
    'approval atomically binds the exact payload version'
);
insert into public.action_results (
    user_id, action_request_id, idempotency_key, attempt, status, ok, message,
    output, result_hash, verification_status, verified_at
) values (
    '11111111-1111-4111-8111-111111111111',
    '70000000-0000-4000-8000-000000000001', 'result:request-1:attempt-1',
    1, 'succeeded', true, 'Task found after write', '{"taskId":"task-1"}',
    repeat('1', 64), 'verified', now()
);
select results_eq(
    $$select count(*)::bigint from public.action_results as result join public.action_requests as request on request.id = result.action_request_id join public.candidate_actions as candidate on candidate.id = request.candidate_action_id join public.insights as insight on insight.id = candidate.insight_id join public.insight_timeline_events as evidence on evidence.insight_id = insight.id join public.timeline_events as event on event.id = evidence.timeline_event_id join public.raw_observations as observation on observation.id = event.observation_id where result.verification_status = 'verified'$$,
    $$values (1::bigint)$$,
    'a verified result traces to its source observation'
);

delete from public.raw_observations
where id = '30000000-0000-4000-8000-000000000001';
select results_eq(
    $$select (select count(*) from public.timeline_events) + (select count(*) from public.insights) + (select count(*) from public.insight_timeline_events) + (select count(*) from public.candidate_actions)$$,
    $$values (0::bigint)$$,
    'deleting source data cascades through every derived record'
);
select results_eq(
    $$select count(*)::bigint from public.action_requests where candidate_action_id is null$$,
    $$values (1::bigint)$$,
    'the minimized approval and outcome receipt survives source deletion'
);

reset role;
select * from finish();
rollback;
