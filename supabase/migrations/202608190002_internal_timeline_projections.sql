-- Forward-only internal domain projections for the canonical V1 timeline.

alter table public.todos
    add column if not exists due_at timestamptz,
    add column if not exists updated_at timestamptz;

update public.todos
set updated_at = created_at
where updated_at is null;

alter table public.todos
    alter column updated_at set default now(),
    alter column updated_at set not null;

alter table public.activity_events
    add column if not exists event_type text,
    add column if not exists source_id text,
    add column if not exists source_table text,
    add column if not exists priority text not null default 'normal',
    add column if not exists category text not null default 'system',
    add column if not exists is_archived boolean not null default false,
    add column if not exists occurred_at timestamptz not null default now(),
    add column if not exists related_entities jsonb not null default '[]'::jsonb,
    add column if not exists action_url text,
    add column if not exists origin text not null default 'domain';

alter table public.activity_events
    add constraint activity_events_origin_check
        check (origin in ('domain', 'system', 'external', 'timeline_projection'))
        not valid;

create index if not exists activity_events_projection_idx
    on public.activity_events(event_type, occurred_at)
    where origin <> 'timeline_projection' and event_type is not null;

create or replace function public.emit_internal_timeline_event(
    p_user_id uuid,
    p_source_type text,
    p_source_table text,
    p_source_id text,
    p_source_version text,
    p_event_type text,
    p_title text,
    p_occurred_at timestamptz,
    p_metadata jsonb default '{}'::jsonb,
    p_retract_prior boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    observation_id uuid;
    timeline_id uuid;
    observation_key text;
    timeline_key text;
    minimized_payload jsonb;
    observation_hash text;
    event_hash text;
    existing_hash text;
    safe_title text;
begin
    if p_user_id is null or p_source_id is null or p_source_version is null then
        raise exception 'Internal timeline identity is required';
    end if;

    safe_title := left(coalesce(nullif(btrim(p_title), ''), 'Internal event'), 500);
    observation_key := concat(
        'observation:internal:', p_source_table, ':', p_source_id, ':',
        p_event_type, ':', p_source_version
    );
    timeline_key := concat(
        'timeline:internal:', p_source_table, ':', p_source_id, ':',
        p_event_type, ':', p_source_version
    );
    minimized_payload := jsonb_build_object(
        'sourceRecordTable', p_source_table,
        'sourceRecordId', p_source_id,
        'sourceVersion', p_source_version,
        'change', p_event_type
    );
    observation_hash := md5(minimized_payload::text);
    event_hash := md5(concat_ws(
        '|', p_event_type, p_source_type, p_source_table, p_source_id,
        safe_title, p_source_version
    ));

    if p_retract_prior then
        update public.timeline_events
        set state = 'deleted',
            deleted_at = p_occurred_at,
            title = 'Deleted source event',
            summary = null,
            content_hash = md5(concat('deleted:', id::text, ':', p_occurred_at::text)),
            metadata = jsonb_build_object(
                'origin', 'internal_domain',
                'sourceDeleted', true
            )
        where user_id = p_user_id
          and source_record_table = p_source_table
          and source_record_id = p_source_id
          and deleted_at is null;

        update public.raw_observations
        set status = 'deleted',
            payload = '{}'::jsonb,
            payload_cleared_at = p_occurred_at,
            failure_code = null,
            failure_detail = null
        where user_id = p_user_id
          and source_key = concat('internal:', p_source_table)
          and provider_object_id = p_source_id
          and status <> 'deleted';
    end if;

    insert into public.raw_observations (
        user_id, source_type, source_key, provider_object_id,
        provider_version, event_type, idempotency_key, payload, payload_hash,
        occurred_at, normalized_at, normalization_version, status, metadata
    ) values (
        p_user_id, p_source_type, concat('internal:', p_source_table),
        p_source_id, p_source_version, p_event_type, observation_key,
        minimized_payload, observation_hash, p_occurred_at, now(),
        'internal-v1', 'normalized',
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'origin', 'internal_domain',
            'contentMinimized', true
        )
    )
    on conflict (user_id, idempotency_key) do nothing
    returning id into observation_id;

    if observation_id is null then
        select id, payload_hash
        into observation_id, existing_hash
        from public.raw_observations
        where user_id = p_user_id and idempotency_key = observation_key;
        if existing_hash is distinct from observation_hash then
            raise exception 'Internal observation idempotency collision';
        end if;
    end if;

    insert into public.timeline_events (
        user_id, observation_id, idempotency_key, event_type, source_type,
        source_record_table, source_record_id, title, summary, content_hash,
        occurred_at, normalization_version, metadata
    ) values (
        p_user_id, observation_id, timeline_key, p_event_type, p_source_type,
        p_source_table, p_source_id, safe_title, null, event_hash,
        p_occurred_at, 'internal-v1',
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'origin', 'internal_domain',
            'sourceVersion', p_source_version,
            'contentMinimized', true
        )
    )
    on conflict (user_id, idempotency_key) do nothing
    returning id into timeline_id;

    if timeline_id is null then
        select id, content_hash
        into timeline_id, existing_hash
        from public.timeline_events
        where user_id = p_user_id and idempotency_key = timeline_key;
        if existing_hash is distinct from event_hash then
            raise exception 'Internal timeline idempotency collision';
        end if;
    end if;

    return timeline_id;
end;
$$;

revoke all on function public.emit_internal_timeline_event(
    uuid, text, text, text, text, text, text, timestamptz, jsonb, boolean
) from public, anon, authenticated;

create or replace function public.project_todo_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    event_at timestamptz;
    version text;
begin
    if tg_op = 'DELETE' then
        perform public.emit_internal_timeline_event(
            old.user_id, 'internal_task', 'todos', old.id::text,
            concat('deleted-', extract(epoch from clock_timestamp())::numeric),
            'task.deleted', 'Task deleted', clock_timestamp(),
            jsonb_build_object('lifecycleState', 'deleted'), true
        );
        return old;
    end if;

    event_at := coalesce(new.updated_at, new.created_at, now());
    version := event_at::text;
    if tg_op = 'INSERT' then
        perform public.emit_internal_timeline_event(
            new.user_id, 'internal_task', 'todos', new.id::text, version,
            'task.created', concat('Task created: ', left(new.text, 450)),
            new.created_at, jsonb_build_object(
                'completed', new.completed,
                'dueAt', new.due_at
            )
        );
        return new;
    end if;

    if new.completed is distinct from old.completed then
        perform public.emit_internal_timeline_event(
            new.user_id, 'internal_task', 'todos', new.id::text,
            concat(version, '-completion'),
            case when new.completed then 'task.completed' else 'task.reopened' end,
            case when new.completed then 'Task completed' else 'Task reopened' end,
            coalesce(new.completed_at, event_at),
            jsonb_build_object('completed', new.completed)
        );
    end if;
    if new.due_at is distinct from old.due_at then
        perform public.emit_internal_timeline_event(
            new.user_id, 'internal_task', 'todos', new.id::text,
            concat(version, '-due'), 'task.due_changed',
            'Task due date changed', event_at,
            jsonb_build_object('dueAt', new.due_at)
        );
    end if;
    if new.text is distinct from old.text then
        perform public.emit_internal_timeline_event(
            new.user_id, 'internal_task', 'todos', new.id::text,
            concat(version, '-text'), 'task.updated',
            concat('Task updated: ', left(new.text, 450)), event_at,
            jsonb_build_object('changedFields', jsonb_build_array('text'))
        );
    end if;
    return new;
end;
$$;

create or replace function public.project_content_record_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_row jsonb;
    previous_row jsonb;
    row_user_id uuid;
    row_id text;
    row_title text;
    source_type text;
    event_prefix text;
    event_at timestamptz;
    version text;
    content_changed boolean;
    semantic_changed boolean;
begin
    current_row := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
    previous_row := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
    row_user_id := coalesce((current_row->>'user_id')::uuid, (previous_row->>'user_id')::uuid);
    row_id := coalesce(current_row->>'id', previous_row->>'id');
    row_title := coalesce(current_row->>'title', previous_row->>'title', 'Untitled');
    source_type := case when tg_table_name = 'journals' then 'internal_note' else 'internal_document' end;
    event_prefix := case
        when tg_table_name = 'journals' then 'note'
        when tg_table_name = 'artifacts' then 'artifact'
        else 'document'
    end;

    if tg_op = 'DELETE' then
        event_at := clock_timestamp();
        perform public.emit_internal_timeline_event(
            row_user_id, source_type, tg_table_name, row_id,
            concat('deleted-', extract(epoch from event_at)::numeric),
            concat(event_prefix, '.deleted'), concat(initcap(event_prefix), ' deleted'),
            event_at, jsonb_build_object('lifecycleState', 'deleted'), true
        );
        return old;
    end if;

    event_at := coalesce(
        nullif(current_row->>'updated_at', '')::timestamptz,
        nullif(current_row->>'created_at', '')::timestamptz,
        now()
    );
    version := event_at::text;
    if tg_op = 'INSERT' then
        perform public.emit_internal_timeline_event(
            row_user_id, source_type, tg_table_name, row_id, version,
            concat(event_prefix, '.created'),
            concat(initcap(event_prefix), ' created: ', left(row_title, 430)),
            coalesce(nullif(current_row->>'created_at', '')::timestamptz, event_at),
            jsonb_build_object('recordType', current_row->>'type')
        );
        return new;
    end if;

    if current_row->>'deleted_at' is distinct from previous_row->>'deleted_at' then
        if current_row->>'deleted_at' is not null then
            perform public.emit_internal_timeline_event(
                row_user_id, source_type, tg_table_name, row_id,
                concat(version, '-deleted'), concat(event_prefix, '.deleted'),
                concat(initcap(event_prefix), ' deleted'), event_at,
                jsonb_build_object('lifecycleState', 'deleted'), true
            );
        else
            perform public.emit_internal_timeline_event(
                row_user_id, source_type, tg_table_name, row_id,
                concat(version, '-restored'), concat(event_prefix, '.restored'),
                concat(initcap(event_prefix), ' restored: ', left(row_title, 420)),
                event_at, jsonb_build_object('lifecycleState', 'active')
            );
        end if;
        return new;
    end if;

    if current_row->>'archived_at' is distinct from previous_row->>'archived_at' then
        perform public.emit_internal_timeline_event(
            row_user_id, source_type, tg_table_name, row_id,
            concat(version, '-archive'),
            concat(event_prefix, case when current_row->>'archived_at' is null then '.restored' else '.archived' end),
            concat(initcap(event_prefix), case when current_row->>'archived_at' is null then ' restored' else ' archived' end),
            event_at, jsonb_build_object(
                'lifecycleState', case when current_row->>'archived_at' is null then 'active' else 'archived' end
            )
        );
        return new;
    end if;

    content_changed := current_row->'content' is distinct from previous_row->'content';
    semantic_changed := current_row->'title' is distinct from previous_row->'title'
        or current_row->'tags' is distinct from previous_row->'tags'
        or current_row->'format' is distinct from previous_row->'format'
        or current_row->'content_format' is distinct from previous_row->'content_format'
        or current_row->'type' is distinct from previous_row->'type';

    if semantic_changed then
        perform public.emit_internal_timeline_event(
            row_user_id, source_type, tg_table_name, row_id,
            concat(version, '-semantic'), concat(event_prefix, '.updated'),
            concat(initcap(event_prefix), ' updated: ', left(row_title, 430)),
            event_at, jsonb_build_object('changeKind', 'semantic')
        );
    elsif content_changed then
        perform public.emit_internal_timeline_event(
            row_user_id, source_type, tg_table_name, row_id,
            concat('content-bucket-', floor(extract(epoch from event_at) / 900)::bigint),
            concat(event_prefix, '.updated'),
            concat(initcap(event_prefix), ' updated: ', left(row_title, 430)),
            event_at, jsonb_build_object(
                'changeKind', 'content',
                'coalescedWindowSeconds', 900
            )
        );
    end if;
    return new;
end;
$$;

create or replace function public.project_extraction_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    event_at timestamptz;
begin
    if tg_op = 'DELETE' then
        return old;
    end if;
    if new.extraction_status not in ('ready', 'failed')
        or (tg_op = 'UPDATE' and new.extraction_status is not distinct from old.extraction_status)
    then
        return new;
    end if;
    event_at := coalesce(new.updated_at, new.created_at, now());
    perform public.emit_internal_timeline_event(
        new.user_id, 'internal_document', 'file_text_extractions', new.id::text,
        concat(event_at::text, '-', new.extraction_status),
        case when new.extraction_status = 'ready' then 'document.parse_ready' else 'document.parse_failed' end,
        case when new.extraction_status = 'ready' then 'Document text ready' else 'Document parsing failed' end,
        event_at, jsonb_build_object(
            'fileId', new.file_id,
            'characterCount', new.character_count,
            'tokenEstimate', new.token_estimate,
            'status', new.extraction_status
        )
    );
    return new;
end;
$$;

create or replace function public.project_selected_activity_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.origin = 'timeline_projection'
        or new.event_type not in ('automation.executed', 'automation.failed')
    then
        return new;
    end if;
    perform public.emit_internal_timeline_event(
        new.user_id, 'internal_activity', 'activity_events', new.id::text,
        coalesce(new.occurred_at, new.created_at)::text, new.event_type,
        left(new.title, 500), coalesce(new.occurred_at, new.created_at),
        jsonb_build_object(
            'activityOrigin', new.origin,
            'activitySource', new.source,
            'sourceTable', new.source_table,
            'sourceId', new.source_id
        )
    );
    return new;
end;
$$;

revoke all on function public.project_todo_to_timeline() from public, anon, authenticated;
revoke all on function public.project_content_record_to_timeline() from public, anon, authenticated;
revoke all on function public.project_extraction_to_timeline() from public, anon, authenticated;
revoke all on function public.project_selected_activity_to_timeline() from public, anon, authenticated;

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
    before update on public.todos
    for each row execute function public.set_updated_at();

drop trigger if exists todos_project_timeline on public.todos;
create trigger todos_project_timeline
    after insert or update or delete on public.todos
    for each row execute function public.project_todo_to_timeline();

drop trigger if exists journals_project_timeline on public.journals;
create trigger journals_project_timeline
    after insert or update or delete on public.journals
    for each row execute function public.project_content_record_to_timeline();

drop trigger if exists documents_project_timeline on public.documents;
create trigger documents_project_timeline
    after insert or update or delete on public.documents
    for each row execute function public.project_content_record_to_timeline();

drop trigger if exists artifacts_project_timeline on public.artifacts;
create trigger artifacts_project_timeline
    after insert or update or delete on public.artifacts
    for each row execute function public.project_content_record_to_timeline();

drop trigger if exists extractions_project_timeline on public.file_text_extractions;
create trigger extractions_project_timeline
    after insert or update of extraction_status or delete on public.file_text_extractions
    for each row execute function public.project_extraction_to_timeline();

drop trigger if exists selected_activity_project_timeline on public.activity_events;
create trigger selected_activity_project_timeline
    after insert on public.activity_events
    for each row execute function public.project_selected_activity_to_timeline();
