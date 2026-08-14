-- Canonical V1 observation -> timeline -> insight -> candidate chain.

alter table public.integration_connections
    add column if not exists external_account_id text,
    add column if not exists sync_cursor text,
    add column if not exists sync_status text not null default 'idle',
    add column if not exists last_sync_started_at timestamptz,
    add column if not exists last_sync_succeeded_at timestamptz,
    add column if not exists next_sync_at timestamptz,
    add column if not exists consecutive_failures integer not null default 0,
    add column if not exists sync_error_code text,
    add column if not exists sync_error_detail text,
    add column if not exists disabled_at timestamptz,
    add column if not exists disconnected_at timestamptz;

alter table public.integration_connections
    add constraint integration_connections_id_user_unique unique (id, user_id),
    add constraint integration_connections_sync_status_check
        check (sync_status in ('idle', 'scheduled', 'syncing', 'healthy', 'degraded', 'disabled', 'disconnected')) not valid,
    add constraint integration_connections_failure_count_check
        check (consecutive_failures >= 0) not valid;

create index if not exists integration_connections_next_sync_idx
    on public.integration_connections(next_sync_at)
    where sync_status in ('scheduled', 'healthy', 'degraded');

create table public.raw_observations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    integration_connection_id uuid,
    source_type text not null,
    source_key text not null,
    provider_object_id text not null,
    provider_version text not null,
    event_type text not null,
    idempotency_key text not null,
    payload jsonb not null default '{}'::jsonb,
    payload_hash text not null,
    occurred_at timestamptz not null,
    ingested_at timestamptz not null default now(),
    normalized_at timestamptz,
    updated_at timestamptz not null default now(),
    normalization_version text,
    status text not null default 'received',
    failure_code text,
    failure_detail text,
    payload_expires_at timestamptz not null default (now() + interval '30 days'),
    payload_cleared_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    constraint raw_observations_id_user_unique unique (id, user_id),
    constraint raw_observations_user_idempotency_unique unique (user_id, idempotency_key),
    constraint raw_observations_connection_owner_fk
        foreign key (integration_connection_id, user_id)
        references public.integration_connections(id, user_id)
        on delete set null (integration_connection_id),
    constraint raw_observations_status_check check (
        status in ('received', 'normalized', 'ignored', 'failed', 'deleted')
    ),
    constraint raw_observations_key_check check (
        length(source_type) between 1 and 120
        and length(source_key) between 1 and 300
        and length(provider_object_id) between 1 and 500
        and length(provider_version) between 1 and 200
        and length(event_type) between 1 and 160
        and length(idempotency_key) between 1 and 700
        and length(payload_hash) between 16 and 200
    ),
    constraint raw_observations_normalized_state_check check (
        status <> 'normalized' or normalized_at is not null
    ),
    constraint raw_observations_payload_clear_check check (
        payload_cleared_at is null or payload = '{}'::jsonb
    )
);

create index raw_observations_source_idx
    on public.raw_observations(user_id, source_key, provider_object_id, occurred_at desc);
create index raw_observations_connection_idx
    on public.raw_observations(integration_connection_id, ingested_at desc)
    where integration_connection_id is not null;
create index raw_observations_payload_expiry_idx
    on public.raw_observations(payload_expires_at)
    where payload_cleared_at is null;

create table public.timeline_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    observation_id uuid not null,
    idempotency_key text not null,
    event_type text not null,
    source_type text not null,
    source_record_table text,
    source_record_id text,
    title text not null,
    summary text,
    content_hash text not null,
    occurred_at timestamptz not null,
    ingested_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    normalization_version text not null,
    revision integer not null default 1,
    state text not null default 'active',
    metadata jsonb not null default '{}'::jsonb,
    expires_at timestamptz not null default (now() + interval '365 days'),
    deleted_at timestamptz,
    constraint timeline_events_id_user_unique unique (id, user_id),
    constraint timeline_events_user_idempotency_unique unique (user_id, idempotency_key),
    constraint timeline_events_observation_owner_fk
        foreign key (observation_id, user_id)
        references public.raw_observations(id, user_id)
        on delete cascade,
    constraint timeline_events_state_check
        check (state in ('active', 'corrected', 'retracted', 'deleted')),
    constraint timeline_events_revision_check check (revision >= 1),
    constraint timeline_events_content_check check (
        length(idempotency_key) between 1 and 700
        and length(event_type) between 1 and 160
        and length(source_type) between 1 and 120
        and length(title) between 1 and 500
        and (summary is null or length(summary) <= 4000)
        and length(content_hash) between 16 and 200
    ),
    constraint timeline_events_source_reference_check check (
        (source_record_table is null) = (source_record_id is null)
    )
);

create index timeline_events_feed_idx
    on public.timeline_events(user_id, occurred_at desc, id desc)
    where deleted_at is null;
create index timeline_events_source_record_idx
    on public.timeline_events(user_id, source_record_table, source_record_id)
    where source_record_id is not null;
create index timeline_events_expiry_idx
    on public.timeline_events(expires_at)
    where deleted_at is null;

create table public.insights (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    primary_timeline_event_id uuid not null,
    idempotency_key text not null,
    kind text not null,
    title text not null,
    summary text not null,
    content_hash text not null,
    model_provider text not null,
    model_name text not null,
    model_version text not null,
    policy_version text not null,
    confidence numeric not null,
    state text not null default 'active',
    failure_code text,
    failure_detail text,
    expires_at timestamptz not null,
    content_cleared_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint insights_id_user_unique unique (id, user_id),
    constraint insights_user_idempotency_unique unique (user_id, idempotency_key),
    constraint insights_primary_event_owner_fk
        foreign key (primary_timeline_event_id, user_id)
        references public.timeline_events(id, user_id)
        on delete cascade,
    constraint insights_confidence_check check (confidence >= 0 and confidence <= 1),
    constraint insights_state_check check (
        state in ('active', 'dismissed', 'expired', 'superseded', 'failed')
    ),
    constraint insights_content_check check (
        length(idempotency_key) between 1 and 700
        and length(kind) between 1 and 120
        and length(title) between 1 and 500
        and length(summary) <= 8000
        and length(content_hash) between 16 and 200
        and length(model_provider) between 1 and 120
        and length(model_name) between 1 and 200
        and length(model_version) between 1 and 200
        and length(policy_version) between 1 and 200
    ),
    constraint insights_content_clear_check check (
        content_cleared_at is null or summary = ''
    )
);

create index insights_active_idx
    on public.insights(user_id, created_at desc)
    where state = 'active';
create index insights_expiry_idx
    on public.insights(expires_at)
    where content_cleared_at is null;

create table public.insight_timeline_events (
    user_id uuid not null references auth.users(id) on delete cascade,
    insight_id uuid not null,
    timeline_event_id uuid not null,
    evidence_role text not null default 'supporting',
    position integer not null default 0,
    created_at timestamptz not null default now(),
    primary key (insight_id, timeline_event_id),
    constraint insight_timeline_events_insight_owner_fk
        foreign key (insight_id, user_id)
        references public.insights(id, user_id)
        on delete cascade,
    constraint insight_timeline_events_event_owner_fk
        foreign key (timeline_event_id, user_id)
        references public.timeline_events(id, user_id)
        on delete cascade,
    constraint insight_timeline_events_role_check check (
        evidence_role in ('primary', 'supporting', 'contradicting')
    ),
    constraint insight_timeline_events_position_check check (position >= 0)
);

create index insight_timeline_events_user_event_idx
    on public.insight_timeline_events(user_id, timeline_event_id);

create table public.candidate_actions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    insight_id uuid not null,
    idempotency_key text not null,
    action_id text not null,
    payload jsonb not null default '{}'::jsonb,
    payload_hash text not null,
    payload_version integer not null default 1,
    policy_version text not null,
    confidence numeric not null,
    state text not null default 'proposed',
    failure_code text,
    failure_detail text,
    expires_at timestamptz not null,
    content_cleared_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint candidate_actions_id_user_unique unique (id, user_id),
    constraint candidate_actions_user_idempotency_unique unique (user_id, idempotency_key),
    constraint candidate_actions_insight_owner_fk
        foreign key (insight_id, user_id)
        references public.insights(id, user_id)
        on delete cascade,
    constraint candidate_actions_confidence_check check (confidence >= 0 and confidence <= 1),
    constraint candidate_actions_payload_version_check check (payload_version >= 1),
    constraint candidate_actions_state_check check (
        state in ('proposed', 'approved', 'denied', 'expired', 'dismissed', 'executing', 'completed', 'failed')
    ),
    constraint candidate_actions_content_check check (
        length(idempotency_key) between 1 and 700
        and length(action_id) between 1 and 240
        and length(payload_hash) between 16 and 200
        and length(policy_version) between 1 and 200
    ),
    constraint candidate_actions_content_clear_check check (
        content_cleared_at is null or payload = '{}'::jsonb
    )
);

create index candidate_actions_review_idx
    on public.candidate_actions(user_id, state, expires_at, created_at desc);
create index candidate_actions_insight_idx
    on public.candidate_actions(user_id, insight_id);

create trigger raw_observations_set_updated_at
    before update on public.raw_observations
    for each row execute function public.set_updated_at();
create trigger timeline_events_set_updated_at
    before update on public.timeline_events
    for each row execute function public.set_updated_at();
create trigger insights_set_updated_at
    before update on public.insights
    for each row execute function public.set_updated_at();
create trigger candidate_actions_set_updated_at
    before update on public.candidate_actions
    for each row execute function public.set_updated_at();

alter table public.raw_observations enable row level security;
alter table public.timeline_events enable row level security;
alter table public.insights enable row level security;
alter table public.insight_timeline_events enable row level security;
alter table public.candidate_actions enable row level security;

create policy "raw_observations_owner" on public.raw_observations
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "timeline_events_owner" on public.timeline_events
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "insights_owner" on public.insights
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "insight_timeline_events_owner" on public.insight_timeline_events
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "candidate_actions_owner" on public.candidate_actions
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.raw_observations from anon, authenticated;
revoke all on table public.timeline_events from anon, authenticated;
revoke all on table public.insights from anon, authenticated;
revoke all on table public.insight_timeline_events from anon, authenticated;
revoke all on table public.candidate_actions from anon, authenticated;
grant select, insert, update, delete on table public.raw_observations to authenticated;
grant select, insert, update, delete on table public.timeline_events to authenticated;
grant select, insert, update, delete on table public.insights to authenticated;
grant select, insert, update, delete on table public.insight_timeline_events to authenticated;
grant select, insert, update, delete on table public.candidate_actions to authenticated;
grant all on table public.raw_observations to service_role;
grant all on table public.timeline_events to service_role;
grant all on table public.insights to service_role;
grant all on table public.insight_timeline_events to service_role;
grant all on table public.candidate_actions to service_role;
