create table email_cache (
    user_id     text primary key,
    emails      jsonb not null default '[]',
    predictions jsonb not null default '{}',
    fetched_at  timestamptz not null default now()
);