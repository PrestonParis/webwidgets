-- Evidence-backed daily and on-demand briefings.

create table public.briefing_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    daily_enabled boolean not null default false,
    local_time time not null default '08:00',
    timezone text not null default 'UTC',
    window_hours integer not null default 24,
    last_enqueued_window_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint briefing_preferences_window_check check (window_hours between 1 and 168),
    constraint briefing_preferences_timezone_check check (length(timezone) between 1 and 100)
);

create table public.briefings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    job_id uuid,
    idempotency_key text not null,
    trigger_type text not null,
    status text not null default 'queued',
    covered_from timestamptz not null,
    covered_to timestamptz not null,
    generated_at timestamptz,
    expires_at timestamptz not null,
    model_provider text not null default 'pending',
    model_name text not null default 'pending',
    model_version text not null default 'pending',
    rule_version text not null,
    warnings text[] not null default '{}',
    source_coverage jsonb not null default '{}'::jsonb,
    input_event_count integer not null default 0,
    surfaced_item_count integer not null default 0,
    latency_ms integer,
    estimated_cost_usd numeric,
    failure_code text,
    failure_detail text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint briefings_id_user_unique unique (id, user_id),
    constraint briefings_user_idempotency_unique unique (user_id, idempotency_key),
    constraint briefings_job_owner_fk foreign key (job_id, user_id)
        references public.jobs(id, user_id) on delete set null (job_id),
    constraint briefings_trigger_check check (trigger_type in ('daily', 'on_demand')),
    constraint briefings_status_check check (
        status in ('queued', 'generating', 'ready', 'partial', 'empty', 'stale', 'failed')
    ),
    constraint briefings_window_check check (covered_from < covered_to),
    constraint briefings_counts_check check (
        input_event_count >= 0 and surfaced_item_count >= 0
        and (latency_ms is null or latency_ms >= 0)
        and (estimated_cost_usd is null or estimated_cost_usd >= 0)
    ),
    constraint briefings_content_check check (
        length(idempotency_key) between 1 and 700
        and length(rule_version) between 1 and 200
        and length(model_provider) between 1 and 120
        and length(model_name) between 1 and 200
        and length(model_version) between 1 and 200
    )
);

create index briefings_latest_idx
    on public.briefings(user_id, created_at desc);
create index briefings_daily_window_idx
    on public.briefings(user_id, covered_to desc)
    where trigger_type = 'daily';
create index briefings_expiry_idx on public.briefings(expires_at);

create table public.briefing_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    briefing_id uuid not null,
    section text not null,
    title text not null,
    summary text not null,
    position integer not null,
    relevance_score numeric not null,
    novelty_score numeric not null,
    urgency_score numeric not null,
    importance_score numeric not null,
    confidence numeric not null,
    fingerprint text not null,
    created_at timestamptz not null default now(),
    constraint briefing_items_id_user_unique unique (id, user_id),
    constraint briefing_items_briefing_owner_fk foreign key (briefing_id, user_id)
        references public.briefings(id, user_id) on delete cascade,
    constraint briefing_items_position_unique unique (briefing_id, position),
    constraint briefing_items_section_check check (
        section in ('changed', 'matters', 'due', 'review')
    ),
    constraint briefing_items_scores_check check (
        relevance_score between 0 and 1 and novelty_score between 0 and 1
        and urgency_score between 0 and 1 and importance_score between 0 and 1
        and confidence between 0 and 1 and position >= 0
    ),
    constraint briefing_items_content_check check (
        length(title) between 1 and 500 and length(summary) between 1 and 4000
        and length(fingerprint) between 16 and 200
    )
);

create index briefing_items_briefing_idx
    on public.briefing_items(user_id, briefing_id, position);

create table public.briefing_item_evidence (
    user_id uuid not null references auth.users(id) on delete cascade,
    briefing_item_id uuid not null,
    timeline_event_id uuid not null,
    evidence_role text not null default 'supporting',
    created_at timestamptz not null default now(),
    primary key (briefing_item_id, timeline_event_id),
    constraint briefing_item_evidence_item_owner_fk
        foreign key (briefing_item_id, user_id)
        references public.briefing_items(id, user_id) on delete cascade,
    constraint briefing_item_evidence_event_owner_fk
        foreign key (timeline_event_id, user_id)
        references public.timeline_events(id, user_id) on delete cascade,
    constraint briefing_item_evidence_role_check check (
        evidence_role in ('supporting', 'contradicting')
    )
);

create index briefing_item_evidence_event_idx
    on public.briefing_item_evidence(user_id, timeline_event_id);

create table public.briefing_feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    briefing_id uuid not null,
    briefing_item_id uuid not null,
    rating text not null,
    comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint briefing_feedback_briefing_owner_fk foreign key (briefing_id, user_id)
        references public.briefings(id, user_id) on delete cascade,
    constraint briefing_feedback_item_owner_fk foreign key (briefing_item_id, user_id)
        references public.briefing_items(id, user_id) on delete cascade,
    constraint briefing_feedback_user_item_unique unique (user_id, briefing_item_id),
    constraint briefing_feedback_rating_check check (
        rating in ('useful', 'not_useful', 'incorrect')
    ),
    constraint briefing_feedback_comment_check check (
        comment is null or length(comment) <= 1000
    )
);

create trigger briefing_preferences_set_updated_at before update on public.briefing_preferences
    for each row execute function public.set_updated_at();
create trigger briefings_set_updated_at before update on public.briefings
    for each row execute function public.set_updated_at();
create trigger briefing_feedback_set_updated_at before update on public.briefing_feedback
    for each row execute function public.set_updated_at();

alter table public.briefing_preferences enable row level security;
alter table public.briefings enable row level security;
alter table public.briefing_items enable row level security;
alter table public.briefing_item_evidence enable row level security;
alter table public.briefing_feedback enable row level security;

create policy "briefing_preferences_owner" on public.briefing_preferences
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "briefings_owner" on public.briefings
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "briefing_items_owner" on public.briefing_items
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "briefing_item_evidence_owner" on public.briefing_item_evidence
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "briefing_feedback_owner" on public.briefing_feedback
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.briefing_preferences from anon, authenticated;
revoke all on table public.briefings from anon, authenticated;
revoke all on table public.briefing_items from anon, authenticated;
revoke all on table public.briefing_item_evidence from anon, authenticated;
revoke all on table public.briefing_feedback from anon, authenticated;
grant select, insert, update, delete on table public.briefing_preferences to authenticated;
grant select, insert, update, delete on table public.briefings to authenticated;
grant select, insert, update, delete on table public.briefing_items to authenticated;
grant select, insert, update, delete on table public.briefing_item_evidence to authenticated;
grant select, insert, update, delete on table public.briefing_feedback to authenticated;
grant all on table public.briefing_preferences to service_role;
grant all on table public.briefings to service_role;
grant all on table public.briefing_items to service_role;
grant all on table public.briefing_item_evidence to service_role;
grant all on table public.briefing_feedback to service_role;
