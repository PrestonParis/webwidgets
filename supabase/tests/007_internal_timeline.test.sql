begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email)
values
    ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'internal-one@example.invalid'),
    ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-8000-000000000000', 'authenticated', 'authenticated', 'internal-two@example.invalid');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

insert into public.todos (id, user_id, text)
values (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Prepare private launch checklist'
);

select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_type = 'internal_task'$$,
    $$values (1::bigint)$$,
    'task creation emits one canonical event'
);

update public.todos set text = text
where id = '10000000-0000-4000-8000-000000000001';
select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_type = 'internal_task'$$,
    $$values (1::bigint)$$,
    'a no-op task retry emits no duplicate event'
);

update public.todos set text = 'Prepare revised launch checklist'
where id = '10000000-0000-4000-8000-000000000001';
update public.todos set completed = true, completed_at = clock_timestamp()
where id = '10000000-0000-4000-8000-000000000001';
update public.todos set completed = false, completed_at = null
where id = '10000000-0000-4000-8000-000000000001';
update public.todos set due_at = '2026-08-25T16:00:00Z'
where id = '10000000-0000-4000-8000-000000000001';

select results_eq(
    $$select event_type from public.timeline_events where source_type = 'internal_task' order by event_type$$,
    $$values ('task.completed'::text), ('task.created'::text), ('task.due_changed'::text), ('task.reopened'::text), ('task.updated'::text)$$,
    'task lifecycle transitions use the unified event model'
);

insert into public.journals (
    id, user_id, title, content, type, updated_at
) values (
    '20000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Launch reflection', 'PRIVATE_JOURNAL_BODY_DO_NOT_COPY', 'note', clock_timestamp()
);
update public.journals
set content = 'PRIVATE_JOURNAL_BODY_SECOND_VERSION', updated_at = clock_timestamp()
where id = '20000000-0000-4000-8000-000000000001';
update public.journals
set content = 'PRIVATE_JOURNAL_BODY_THIRD_VERSION', updated_at = clock_timestamp()
where id = '20000000-0000-4000-8000-000000000001';

select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_type = 'internal_note'$$,
    $$values (2::bigint)$$,
    'note autosaves coalesce into one event per fifteen-minute window'
);
select ok(
    not exists (
        select 1
        from public.raw_observations observation
        left join public.timeline_events event on event.observation_id = observation.id
        where observation.source_type = 'internal_note'
          and concat(observation.payload::text, event.summary, event.metadata::text)
              like '%PRIVATE_JOURNAL_BODY%'
    ),
    'note bodies are absent from canonical payloads and metadata'
);

insert into public.documents (
    id, user_id, title, content, format
) values (
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Private plan', 'PRIVATE_DOCUMENT_BODY_DO_NOT_COPY', 'markdown'
);
update public.documents
set deleted_at = clock_timestamp(), updated_at = clock_timestamp()
where id = '30000000-0000-4000-8000-000000000001';

select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_record_table = 'documents' and state = 'active'$$,
    $$values (1::bigint)$$,
    'document deletion leaves one active minimized tombstone event'
);
select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_record_table = 'documents' and state = 'deleted'$$,
    $$values (1::bigint)$$,
    'document deletion retracts prior projections'
);
select ok(
    not exists (
        select 1
        from public.raw_observations observation
        left join public.timeline_events event on event.observation_id = observation.id
        where observation.source_key = 'internal:documents'
          and concat(observation.payload::text, event.summary, event.metadata::text)
              like '%PRIVATE_DOCUMENT_BODY%'
    ),
    'document bodies are not duplicated into timeline storage'
);

insert into public.file_uploads (
    id, user_id, original_name, s3_key, status
) values (
    '40000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'private-plan.txt', 'tests/private-plan.txt', 'uploaded'
);
insert into public.file_text_extractions (
    id, user_id, file_id, source_storage_path, extracted_text,
    character_count, extraction_status
) values (
    '50000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '40000000-0000-4000-8000-000000000001', 'tests/private-plan.txt',
    'PRIVATE_EXTRACTED_TEXT_DO_NOT_COPY', 34, 'ready'
);

select results_eq(
    $$select count(*)::bigint from public.timeline_events where event_type = 'document.parse_ready'$$,
    $$values (1::bigint)$$,
    'parse-ready is represented once without the extracted text'
);
select ok(
    not exists (
        select 1 from public.raw_observations observation
        join public.timeline_events event on event.observation_id = observation.id
        where event.event_type = 'document.parse_ready'
          and concat(observation.payload::text, event.summary, event.metadata::text)
              like '%PRIVATE_EXTRACTED_TEXT%'
    ),
    'extracted document text is not copied into canonical events'
);

insert into public.activity_events (
    id, user_id, source, event_type, source_id, source_table,
    title, origin, occurred_at
) values (
    '60000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111', 'automation',
    'automation.executed', 'automation-one', 'automation_configs',
    'Automation completed', 'domain', clock_timestamp()
), (
    '60000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111', 'automation',
    'automation.executed', 'automation-two', 'automation_configs',
    'Projected automation completed', 'timeline_projection', clock_timestamp()
), (
    '60000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111', 'todo',
    'todo.created', 'todo-one', 'todos', 'Duplicate task activity',
    'domain', clock_timestamp()
);

select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_type = 'internal_activity'$$,
    $$values (1::bigint)$$,
    'only allowlisted domain activity is projected and feedback is ignored'
);

insert into public.quick_notes (user_id, content)
values ('11111111-1111-4111-8111-111111111111', 'AUTOSAVE_CONTENT');
select results_eq(
    $$select count(*)::bigint from public.raw_observations where source_key = 'internal:quick_notes'$$,
    $$values (0::bigint)$$,
    'scratchpad autosaves are outside the V1 timeline boundary'
);

delete from public.todos
where id = '10000000-0000-4000-8000-000000000001';
select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_record_table = 'todos' and state = 'active'$$,
    $$values (1::bigint)$$,
    'task deletion leaves one active tombstone fact'
);
select results_eq(
    $$select count(*)::bigint from public.raw_observations where source_key = 'internal:todos' and status = 'deleted'$$,
    $$values (5::bigint)$$,
    'task deletion clears and marks all prior raw observations deleted'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
insert into public.todos (id, user_id, text)
values (
    '10000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222', 'Second owner task'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select results_eq(
    $$select count(*)::bigint from public.timeline_events where source_record_id = '10000000-0000-4000-8000-000000000002'$$,
    $$values (0::bigint)$$,
    'internal timeline events remain isolated between owners'
);
select throws_ok(
    $$insert into public.todos (user_id, text) values ('22222222-2222-4222-8222-222222222222', 'Cross-user task')$$,
    '42501', null, 'RLS rejects a cross-user domain write before projection'
);

reset role;
select * from finish();
rollback;
