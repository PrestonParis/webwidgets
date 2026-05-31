alter table if exists public.context_entries
    add column if not exists summary text,
    add column if not exists tags text[] not null default '{}',
    add column if not exists source_type text not null default 'manual',
    add column if not exists source_id text,
    add column if not exists source_table text,
    add column if not exists source_collection text,
    add column if not exists created_by text,
    add column if not exists created_by_type text not null default 'user',
    add column if not exists confidence numeric not null default 1,
    add column if not exists status text not null default 'active',
    add column if not exists visibility text not null default 'private',
    add column if not exists permissions text[] not null default array['private'],
    add column if not exists last_observed_at timestamptz,
    add column if not exists last_verified_at timestamptz,
    add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists context_entries_user_source_unique
    on public.context_entries(user_id, source_type, source_id)
    where source_id is not null;

create index if not exists context_entries_user_entity_idx on public.context_entries(user_id, entity_id);
create index if not exists context_entries_user_type_idx on public.context_entries(user_id, entry_type);
create index if not exists context_entries_user_source_idx on public.context_entries(user_id, source_type, source_id);
create index if not exists context_entries_user_status_idx on public.context_entries(user_id, status);
create index if not exists context_entries_user_updated_idx on public.context_entries(user_id, updated_at desc);

create table if not exists public.context_edges (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    from_entity_id text not null,
    to_entity_id text not null,
    kind text not null,
    label text,
    weight numeric not null default 1,
    confidence numeric not null default 1,
    created_by text,
    created_by_type text not null default 'user',
    source_type text not null default 'manual',
    source_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint context_edges_not_self check (from_entity_id <> to_entity_id)
);

create unique index if not exists context_edges_user_semantic_unique
    on public.context_edges(user_id, from_entity_id, to_entity_id, kind, source_type, source_id);
create index if not exists context_edges_user_from_idx on public.context_edges(user_id, from_entity_id);
create index if not exists context_edges_user_to_idx on public.context_edges(user_id, to_entity_id);
create index if not exists context_edges_user_kind_idx on public.context_edges(user_id, kind);
create index if not exists context_edges_user_updated_idx on public.context_edges(user_id, updated_at desc);

create table if not exists public.context_permissions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    capture_widget_interactions boolean not null default true,
    capture_chat_memory boolean not null default true,
    capture_files boolean not null default true,
    capture_documents boolean not null default true,
    capture_integrations boolean not null default true,
    allow_ai_personalization boolean not null default true,
    allow_automation_context_access boolean not null default true,
    allow_cross_widget_context boolean not null default true,
    allow_inferred_relationships boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.context_saved_views (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    filters jsonb not null default '{}'::jsonb,
    layout_mode text not null default 'cluster',
    focus_node text,
    viewport jsonb not null default '{}'::jsonb,
    visible_node_types text[] not null default '{}',
    visible_edge_kinds text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists context_saved_views_user_updated_idx
    on public.context_saved_views(user_id, updated_at desc);

alter table if exists public.context_entries enable row level security;
alter table public.context_edges enable row level security;
alter table public.context_permissions enable row level security;
alter table public.context_saved_views enable row level security;

drop policy if exists "context_entries_user_isolation" on public.context_entries;
create policy "context_entries_user_isolation" on public.context_entries
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "context_edges_user_isolation" on public.context_edges;
create policy "context_edges_user_isolation" on public.context_edges
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "context_permissions_user_isolation" on public.context_permissions;
create policy "context_permissions_user_isolation" on public.context_permissions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "context_saved_views_user_isolation" on public.context_saved_views;
create policy "context_saved_views_user_isolation" on public.context_saved_views
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
