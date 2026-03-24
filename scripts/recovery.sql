create table recovery_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    start_time timestamp,
    current_streak_seconds int default 0,
    longest_streak_seconds int default 0,
    created_at timestamp default now()
);

create table urges (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    intensity int, -- 1–10
    trigger text,
    note text,
    created_at timestamp default now()
);

create table relapses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    note text,
    created_at timestamp default now()
);