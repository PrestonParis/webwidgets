begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email) values
    ('91111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'task-one@example.invalid'),
    ('92222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'task-two@example.invalid');

insert into public.raw_observations (
    id, user_id, source_type, source_key, provider_object_id, provider_version,
    event_type, idempotency_key, payload_hash, occurred_at, status
) values (
    '93000000-0000-4000-8000-000000000001',
    '91111111-1111-4111-8111-111111111111', 'gmail', 'task-source',
    'task-source', '1', 'email.received', 'task-action-observation',
    repeat('1', 64), now(), 'normalized'
);
insert into public.timeline_events (
    id, user_id, observation_id, idempotency_key, event_type, source_type,
    title, content_hash, occurred_at, normalization_version
) values (
    '94000000-0000-4000-8000-000000000001',
    '91111111-1111-4111-8111-111111111111',
    '93000000-0000-4000-8000-000000000001', 'task-action-timeline',
    'email.received', 'gmail', 'Ship the task engine', repeat('2', 64),
    now(), 'test'
);
insert into public.insights (
    id, user_id, primary_timeline_event_id, idempotency_key, kind, title,
    summary, content_hash, model_provider, model_name, model_version,
    policy_version, confidence, expires_at
) values (
    '95000000-0000-4000-8000-000000000001',
    '91111111-1111-4111-8111-111111111111',
    '94000000-0000-4000-8000-000000000001', 'task-action-insight',
    'commitment', 'Ship task engine', 'Explicit dated commitment',
    repeat('3', 64), 'rules', 'rules', '1', 'task-action-v1', 0.95,
    now() + interval '7 days'
);
insert into public.insight_timeline_events (
    user_id, insight_id, timeline_event_id, evidence_role
) values (
    '91111111-1111-4111-8111-111111111111',
    '95000000-0000-4000-8000-000000000001',
    '94000000-0000-4000-8000-000000000001', 'primary'
);
insert into public.candidate_actions (
    id, user_id, insight_id, idempotency_key, action_id, candidate_kind,
    payload, payload_hash, policy_version, confidence, reason,
    extractor_version, expires_at
) values (
    '96000000-0000-4000-8000-000000000001',
    '91111111-1111-4111-8111-111111111111',
    '95000000-0000-4000-8000-000000000001', 'task-action-candidate',
    'tasks.create', 'task',
    '{"title":"Ship task engine","notes":"Verify the outcome","dueAt":"2026-09-01T17:00:00Z"}',
    repeat('4', 64), 'task-action-v1', 0.95, 'Explicit commitment',
    'rules-v1', now() + interval '7 days'
);

set local role authenticated;
set local request.jwt.claim.sub = '91111111-1111-4111-8111-111111111111';
select is(
    (select state from public.review_candidate_action(
        '96000000-0000-4000-8000-000000000001', 1, repeat('4', 64), 'approved'
    )), 'approved', 'candidate approval binds the exact task payload'
);
select is(
    (select approval_state from public.materialize_approved_task_action(
        '96000000-0000-4000-8000-000000000001', 1, repeat('4', 64)
    )), 'approved', 'approved candidate materializes an approved action request'
);
select throws_ok(
    $$select public.materialize_approved_task_action('96000000-0000-4000-8000-000000000001', 2, repeat('4', 64))$$,
    'P0001', 'task_action_stale_approval', 'stale candidate versions cannot execute'
);
select ok(
    not has_function_privilege('authenticated', 'public.execute_approved_task_action(uuid,uuid,integer)', 'EXECUTE'),
    'browser sessions cannot invoke the worker mutation function'
);

reset role;
insert into public.jobs (
    id, user_id, type, status, idempotency_key, correlation_id, queue_name,
    queue_job_id
) values (
    '97000000-0000-4000-8000-000000000001',
    '91111111-1111-4111-8111-111111111111', 'action.execute', 'running',
    'execute:create', 'create', 'v1-action',
    '97000000-0000-4000-8000-000000000001'
);
select lives_ok(
    $$select public.execute_approved_task_action(
        (select id from public.action_requests where candidate_action_id = '96000000-0000-4000-8000-000000000001'),
        '97000000-0000-4000-8000-000000000001', 1
    )$$,
    'create executes through the service-only worker boundary'
);
select results_eq(
    $$select count(*)::bigint from public.todos where source_action_request_id = (select id from public.action_requests where candidate_action_id = '96000000-0000-4000-8000-000000000001')$$,
    $$values (1::bigint)$$,
    'one approved candidate creates exactly one canonical task'
);
select lives_ok(
    $$select public.execute_approved_task_action(
        (select id from public.action_requests where candidate_action_id = '96000000-0000-4000-8000-000000000001'),
        '97000000-0000-4000-8000-000000000001', 2
    )$$,
    'worker redelivery returns the existing verified outcome'
);
select results_eq(
    $$select count(*)::bigint from public.action_results where action_request_id = (select id from public.action_requests where candidate_action_id = '96000000-0000-4000-8000-000000000001')$$,
    $$values (1::bigint)$$,
    'worker redelivery does not duplicate the outcome'
);

insert into public.action_requests (
    id, user_id, idempotency_key, action_id, payload, payload_hash,
    payload_version, approval_state, approved_payload, approved_payload_hash,
    approved_payload_version, approved_at, policy_version,
    permission_snapshot_hash, status
)
select
    '98000000-0000-4000-8000-000000000001', user_id, 'execute:update',
    'tasks.update', jsonb_build_object(
        'taskId', id, 'expectedUpdatedAt', updated_at,
        'title', 'Ship verified task engine', 'notes', 'Updated safely'
    ), repeat('5', 64), 1, 'approved', jsonb_build_object(
        'taskId', id, 'expectedUpdatedAt', updated_at,
        'title', 'Ship verified task engine', 'notes', 'Updated safely'
    ), repeat('5', 64), 1, now(), 'task-action-v1', repeat('6', 64), 'queued'
from public.todos where source_action_request_id is not null;
insert into public.jobs (
    id, user_id, type, status, idempotency_key, correlation_id, queue_name, queue_job_id
) values (
    '97000000-0000-4000-8000-000000000002',
    '91111111-1111-4111-8111-111111111111', 'action.execute', 'running',
    'execute:update', 'update', 'v1-action',
    '97000000-0000-4000-8000-000000000002'
);
select lives_ok(
    $$select public.execute_approved_task_action(
        '98000000-0000-4000-8000-000000000001',
        '97000000-0000-4000-8000-000000000002', 1
    )$$,
    'update changes the canonical task'
);
select results_eq(
    $$select text, notes from public.todos where source_action_request_id is not null$$,
    $$values ('Ship verified task engine'::text, 'Updated safely'::text)$$,
    'updated task is read back with the requested values'
);

set local role authenticated;
set local request.jwt.claim.sub = '91111111-1111-4111-8111-111111111111';
select is(
    (public.undo_task_action('98000000-0000-4000-8000-000000000001')->>'undone')::boolean,
    true, 'safe update compensation restores the prior task snapshot'
);
reset role;
select results_eq(
    $$select text from public.todos where source_action_request_id is not null$$,
    $$values ('Ship task engine'::text)$$,
    'update undo restores the original title'
);

insert into public.action_requests (
    id, user_id, idempotency_key, action_id, payload, payload_hash,
    payload_version, approval_state, approved_payload, approved_payload_hash,
    approved_payload_version, approved_at, policy_version,
    permission_snapshot_hash, status
)
select
    '98000000-0000-4000-8000-000000000002', user_id, 'execute:complete',
    'tasks.complete', jsonb_build_object('taskId', id, 'expectedUpdatedAt', updated_at),
    repeat('7', 64), 1, 'approved',
    jsonb_build_object('taskId', id, 'expectedUpdatedAt', updated_at),
    repeat('7', 64), 1, now(), 'task-action-v1', repeat('8', 64), 'queued'
from public.todos where source_action_request_id is not null;
insert into public.jobs (
    id, user_id, type, status, idempotency_key, correlation_id, queue_name, queue_job_id
) values (
    '97000000-0000-4000-8000-000000000003',
    '91111111-1111-4111-8111-111111111111', 'action.execute', 'running',
    'execute:complete', 'complete', 'v1-action',
    '97000000-0000-4000-8000-000000000003'
);
select lives_ok(
    $$select public.execute_approved_task_action(
        '98000000-0000-4000-8000-000000000002',
        '97000000-0000-4000-8000-000000000003', 1
    )$$,
    'complete changes the canonical task'
);
select ok(
    (select completed and completed_at is not null from public.todos where source_action_request_id is not null),
    'completed task is verified in canonical storage'
);
select results_eq(
    $$select undo_status from public.action_results where action_request_id = '98000000-0000-4000-8000-000000000002'$$,
    $$values ('not_available'::text)$$,
    'completion reversal is explicitly unavailable'
);

insert into public.todos (id, user_id, text) values (
    '99000000-0000-4000-8000-000000000001',
    '92222222-2222-4222-8222-222222222222', 'Other user task'
);
insert into public.action_requests (
    id, user_id, idempotency_key, action_id, payload, payload_hash,
    payload_version, approval_state, approved_payload, approved_payload_hash,
    approved_payload_version, approved_at, policy_version,
    permission_snapshot_hash, status
) values (
    '98000000-0000-4000-8000-000000000003',
    '91111111-1111-4111-8111-111111111111', 'execute:cross-user',
    'tasks.complete',
    '{"taskId":"99000000-0000-4000-8000-000000000001","expectedUpdatedAt":"2000-01-01T00:00:00Z"}',
    repeat('9', 64), 1, 'approved',
    '{"taskId":"99000000-0000-4000-8000-000000000001","expectedUpdatedAt":"2000-01-01T00:00:00Z"}',
    repeat('9', 64), 1, now(), 'task-action-v1', repeat('a', 64), 'queued'
);
select throws_ok(
    $$select public.execute_approved_task_action(
        '98000000-0000-4000-8000-000000000003',
        '97000000-0000-4000-8000-000000000003', 1
    )$$,
    'P0001', 'task_action_forbidden', 'cross-user task access is rejected'
);

select * from finish();
rollback;
