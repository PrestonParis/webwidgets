create table if not exists user_tokens (
    user_id      uuid primary key references auth.users(id) on delete cascade,
    access_token text not null,
    refresh_token text,
    updated_at   timestamptz not null default now()
);

alter table user_tokens enable row level security;

create policy "Users can read own tokens"
    on user_tokens for select
    using (auth.uid() = user_id);

create policy "Users can write own tokens"
    on user_tokens for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);