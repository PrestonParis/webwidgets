-- supabase/migrations/add_dashboard_layouts.sql
create table if not exists dashboard_layouts (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    layout      jsonb not null default '[]',
    updated_at  timestamptz not null default now(),
    unique(user_id)
);

alter table dashboard_layouts enable row level security;

create policy "Users can read own layout"
    on dashboard_layouts for select
    using (auth.uid() = user_id);

create policy "Users can upsert own layout"
    on dashboard_layouts for insert
    with check (auth.uid() = user_id);

create policy "Users can update own layout"
    on dashboard_layouts for update
    using (auth.uid() = user_id);