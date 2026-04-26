-- ─────────────────────────────────────────────
-- widget_settings
-- One row per (user, widget). Settings stored
-- as jsonb so new keys never need a migration.
-- ─────────────────────────────────────────────

create table if not exists public.widget_settings (
id          uuid primary key default gen_random_uuid(),
user_id     uuid not null references auth.users(id) on delete cascade,
widget_id   text not null,          -- matches WidgetConfig.id in the layout
settings    jsonb not null default '{}',
updated_at  timestamptz not null default now(),

unique (user_id, widget_id)
);

-- Keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
new.updated_at = now();
return new;
end;
$$;

drop trigger if exists widget_settings_updated_at on public.widget_settings;
create trigger widget_settings_updated_at
before update on public.widget_settings
for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.widget_settings enable row level security;

-- Users can only see their own rows
create policy "widget_settings: select own"
on public.widget_settings for select
using (auth.uid() = user_id);

-- Users can only insert rows for themselves
create policy "widget_settings: insert own"
on public.widget_settings for insert
with check (auth.uid() = user_id);

-- Users can only update their own rows
create policy "widget_settings: update own"
on public.widget_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can only delete their own rows
create policy "widget_settings: delete own"
on public.widget_settings for delete
using (auth.uid() = user_id);