-- 1. Add the missing expiration column
-- Google provides expiry in milliseconds, so bigint is the safest type.
alter table public.user_tokens 
add column if not exists expires_at bigint;

-- 2. Add a provider column (Good practice if you ever add Outlook/GitHub)
alter table public.user_tokens 
add column if not exists provider text default 'google';

-- 3. Consolidate your policies
-- Using 'FOR ALL' is cleaner than separate Read/Write policies for this table.
drop policy if exists "Users can read own tokens" on user_tokens;
drop policy if exists "Users can write own tokens" on user_tokens;

create policy "Users can manage own tokens"
    on public.user_tokens for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 4. Add a trigger to auto-update the 'updated_at' timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_user_tokens_updated_at
    before update on public.user_tokens
    for each row
    execute function update_updated_at_column();