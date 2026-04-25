create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    created_at timestamp default now(),
    updated_at timestamp default now()
);
alter table public.profiles enable row level security;

create policy "Users can read their profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can insert their profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update their profile"
on public.profiles
for update
using (auth.uid() = id);