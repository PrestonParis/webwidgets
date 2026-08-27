begin;
set local search_path = public, extensions;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email) values
    ('81111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate-one@example.invalid'),
    ('82222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate-two@example.invalid');

insert into public.raw_observations (
    id, user_id, source_type, source_key, provider_object_id, provider_version,
    event_type, idempotency_key, payload_hash, occurred_at, status
) values
    ('83000000-0000-4000-8000-000000000001', '81111111-1111-4111-8111-111111111111', 'gmail', 'one', 'one', '1', 'email.received', 'candidate-observation-one', repeat('1', 64), now(), 'normalized'),
    ('83000000-0000-4000-8000-000000000002', '82222222-2222-4222-8222-222222222222', 'gmail', 'two', 'two', '1', 'email.received', 'candidate-observation-two', repeat('2', 64), now(), 'normalized');
insert into public.timeline_events (
    id, user_id, observation_id, idempotency_key, event_type, source_type,
    title, content_hash, occurred_at, normalization_version
) values
    ('84000000-0000-4000-8000-000000000001', '81111111-1111-4111-8111-111111111111', '83000000-0000-4000-8000-000000000001', 'candidate-timeline-one', 'email.received', 'gmail', 'Send memo', repeat('3', 64), now(), 'test'),
    ('84000000-0000-4000-8000-000000000002', '82222222-2222-4222-8222-222222222222', '83000000-0000-4000-8000-000000000002', 'candidate-timeline-two', 'email.received', 'gmail', 'Other memo', repeat('4', 64), now(), 'test');
insert into public.insights (
    id, user_id, primary_timeline_event_id, idempotency_key, kind, title,
    summary, content_hash, model_provider, model_name, model_version,
    policy_version, confidence, expires_at
) values (
    '85000000-0000-4000-8000-000000000001', '81111111-1111-4111-8111-111111111111',
    '84000000-0000-4000-8000-000000000001', 'candidate-insight-one', 'commitment',
    'Send memo', 'Dated request', repeat('5', 64), 'rules', 'rules', '1', 'candidate-v1', 0.9, now() + interval '7 days'
);
insert into public.candidate_actions (
    id, user_id, insight_id, idempotency_key, action_id, candidate_kind,
    payload, payload_hash, policy_version, confidence, reason,
    extractor_version, expires_at
) values (
    '86000000-0000-4000-8000-000000000001', '81111111-1111-4111-8111-111111111111',
    '85000000-0000-4000-8000-000000000001', 'candidate-one', 'tasks.create', 'task',
    '{"title":"Send memo","dueAt":"2026-08-30T17:00:00Z"}', repeat('6', 64),
    'candidate-v1', 0.9, 'Dated request', 'rules-v1', now() + interval '7 days'
);

insert into public.candidate_action_evidence (
    user_id, candidate_action_id, timeline_event_id, evidence_role
) values (
    '81111111-1111-4111-8111-111111111111',
    '86000000-0000-4000-8000-000000000001',
    '84000000-0000-4000-8000-000000000001', 'primary'
);
select throws_ok(
    $$insert into public.candidate_action_evidence (user_id, candidate_action_id, timeline_event_id) values ('81111111-1111-4111-8111-111111111111', '86000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000002')$$,
    '23503', null, 'cross-owner evidence is rejected'
);

set local role authenticated;
set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';

select results_eq(
    $$select count(*)::bigint from public.candidate_action_evidence$$,
    $$values (1::bigint)$$,
    'owner can read server-linked candidate evidence'
);
select is(
    (select payload_version from public.edit_candidate_action(
        '86000000-0000-4000-8000-000000000001', 1,
        '{"title":"Send final memo","dueAt":"2026-08-31T17:00:00Z"}', repeat('7', 64)
    )), 2, 'editing creates a new payload version'
);
select is(
    (select state from public.edit_candidate_action(
        '86000000-0000-4000-8000-000000000001', 2,
        '{"title":"Send final memo","dueAt":"2026-09-01T17:00:00Z"}', repeat('8', 64)
    )), 'edited', 'editing invalidates any prior approval state'
);
select throws_ok(
    $$select public.review_candidate_action('86000000-0000-4000-8000-000000000001', 2, repeat('7', 64), 'approved')$$,
    'P0001', 'candidate_review_conflict', 'stale payload approval is rejected'
);
select is(
    (select state from public.review_candidate_action(
        '86000000-0000-4000-8000-000000000001', 3, repeat('8', 64), 'approved'
    )), 'approved', 'approval binds the exact edited payload'
);
select ok(
    (select approved_payload_version = payload_version and approved_payload_hash = payload_hash
     from public.candidate_actions where id = '86000000-0000-4000-8000-000000000001'),
    'approved hash and version match current payload'
);
select results_eq(
    $$select decision from public.candidate_action_reviews order by created_at$$,
    $$values ('edited'::text), ('edited'::text), ('approved'::text)$$,
    'review history is measurable and append-only to users'
);
select ok(
    not has_table_privilege('authenticated', 'public.candidate_actions', 'UPDATE'),
    'authenticated users cannot bypass candidate review functions'
);
select ok(
    not has_table_privilege('authenticated', 'public.candidate_actions', 'INSERT')
    and not has_table_privilege('authenticated', 'public.candidate_action_evidence', 'INSERT'),
    'candidate proposals and evidence are server-owned derived records'
);
select ok(
    not has_table_privilege('authenticated', 'public.candidate_action_reviews', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.candidate_action_reviews', 'INSERT')
    and not has_table_privilege('authenticated', 'public.candidate_action_reviews', 'DELETE'),
    'authenticated review history cannot be rewritten'
);

reset role;
select * from finish();
rollback;
