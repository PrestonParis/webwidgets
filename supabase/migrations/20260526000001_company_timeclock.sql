-- Company-scoped employee/employer foundation and timeclock entries.

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.company_memberships (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'employee'
    check (role in ('owner', 'admin', 'manager', 'employee')),
  status     text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);
create unique index if not exists company_memberships_company_user_unique
  on public.company_memberships(company_id, user_id)
  where user_id is not null;
create index if not exists company_memberships_user_idx
  on public.company_memberships(user_id, status);
create table if not exists public.company_timeclock_entries (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  clock_in_at  timestamptz not null default now(),
  clock_out_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (clock_out_at is null or clock_out_at >= clock_in_at)
);
create unique index if not exists company_timeclock_one_open_shift
  on public.company_timeclock_entries(company_id, user_id)
  where clock_out_at is null;
create index if not exists company_timeclock_company_started_idx
  on public.company_timeclock_entries(company_id, clock_in_at desc);
create or replace function public.set_company_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_company_updated_at();
drop trigger if exists company_memberships_updated_at on public.company_memberships;
create trigger company_memberships_updated_at
  before update on public.company_memberships
  for each row execute function public.set_company_updated_at();
drop trigger if exists company_timeclock_updated_at on public.company_timeclock_entries;
create trigger company_timeclock_updated_at
  before update on public.company_timeclock_entries
  for each row execute function public.set_company_updated_at();
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_timeclock_entries enable row level security;
create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;
create or replace function public.is_company_leader(
  target_company_id uuid,
  allowed_roles text[] default array['owner', 'admin', 'manager']
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role = any(allowed_roles)
  );
$$;
create policy "company members can view companies"
  on public.companies for select
  using (
    owner_id = auth.uid()
    or public.is_company_member(id)
  );
create policy "users can create owned companies"
  on public.companies for insert
  with check (owner_id = auth.uid());
create policy "company owners and admins update companies"
  on public.companies for update
  using (
    owner_id = auth.uid()
    or public.is_company_leader(id, array['owner', 'admin'])
  )
  with check (
    owner_id = auth.uid()
    or public.is_company_leader(id, array['owner', 'admin'])
  );
create policy "company owners delete companies"
  on public.companies for delete
  using (owner_id = auth.uid());
create policy "members can view company memberships"
  on public.company_memberships for select
  using (
    user_id = auth.uid()
    or lower(email) = lower(auth.jwt() ->> 'email')
    or public.is_company_member(company_id)
  );
create policy "company leaders can insert memberships"
  on public.company_memberships for insert
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and c.owner_id = auth.uid()
        and user_id = auth.uid()
        and role = 'owner'
        and status = 'active'
    )
    or public.is_company_leader(company_id)
  );
create policy "company owners and admins update memberships"
  on public.company_memberships for update
  using (
    public.is_company_leader(company_id, array['owner', 'admin'])
  )
  with check (
    public.is_company_leader(company_id, array['owner', 'admin'])
  );
create policy "invitees can accept their company role"
  on public.company_memberships for update
  using (
    status = 'invited'
    and user_id is null
    and lower(email) = lower(auth.jwt() ->> 'email')
  )
  with check (
    status = 'active'
    and user_id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );
create policy "company owners and admins delete memberships"
  on public.company_memberships for delete
  using (
    public.is_company_leader(company_id, array['owner', 'admin'])
  );
create policy "members and leaders view timeclock entries"
  on public.company_timeclock_entries for select
  using (
    user_id = auth.uid()
    or public.is_company_leader(company_id)
  );
create policy "active members clock themselves in"
  on public.company_timeclock_entries for insert
  with check (
    user_id = auth.uid()
    and public.is_company_member(company_id)
  );
create policy "members clock themselves out"
  on public.company_timeclock_entries for update
  using (
    user_id = auth.uid()
    or public.is_company_leader(company_id)
  )
  with check (
    user_id = auth.uid()
    or public.is_company_leader(company_id)
  );
