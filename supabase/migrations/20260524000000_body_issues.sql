-- body_issues: dedicated table for the Injury Tracker widget
create table if not exists public.body_issues (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  region_id     text not null,
  region_type   text not null default 'general',
  issue_type    text not null default 'soreness',
  severity      int  not null check (severity between 1 and 10),
  onset_date    date not null default current_date,
  duration_type text not null default 'acute' check (duration_type in ('acute','chronic')),
  status        text not null default 'active' check (status in ('active','improving','resolved')),
  notes         text,
  triggers      text[] not null default '{}',
  skin_x        float,
  skin_y        float,
  tooth_number  int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.body_issues enable row level security;
create policy "Users manage own body issues"
  on public.body_issues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- history table for tracking severity changes over time
create table if not exists public.body_issue_history (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.body_issues on delete cascade,
  severity    int  not null check (severity between 1 and 10),
  status      text not null,
  notes       text,
  recorded_at timestamptz not null default now()
);
alter table public.body_issue_history enable row level security;
create policy "Users manage own issue history"
  on public.body_issue_history for all
  using (exists (
    select 1 from public.body_issues bi
    where bi.id = issue_id and bi.user_id = auth.uid()
  ));
-- updated_at trigger
create or replace function public.set_body_issue_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger body_issues_updated_at
  before update on public.body_issues
  for each row execute function public.set_body_issue_updated_at();
