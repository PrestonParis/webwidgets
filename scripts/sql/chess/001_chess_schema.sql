-- ─────────────────────────────────────────────
-- chess_games
-- One row per imported game. Position is always
-- derived from pgn + current_move_index at read
-- time via chess.js — never stored redundantly.
-- ─────────────────────────────────────────────

create table if not exists public.chess_games (
id                  uuid primary key default gen_random_uuid(),
user_id             uuid not null references auth.users(id) on delete cascade,

-- Game metadata (parsed from PGN headers)
white               text not null default 'White',
black               text not null default 'Black',
result              text,                        -- "1-0" | "0-1" | "1/2-1/2" | "*"
event               text,
site                text,
played_at           date,

-- Full PGN text as imported
pgn                 text not null,

-- Where the user left off in the replay (0 = starting position)
current_move_index  integer not null default 0,

created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
);

-- Auto-update updated_at (reuse function from widget_settings if it exists,
-- otherwise create it — wrapped in DO block so it's idempotent)
do $$ begin
if not exists (
select 1 from pg_proc where proname = 'set_updated_at'
) then
execute $f$
    create function public.set_updated_at()
    returns trigger language plpgsql as $fn$
    begin
    new.updated_at = now();
    return new;
    end;
    $fn$;
$f$;
end if;
end $$;

drop trigger if exists chess_games_updated_at on public.chess_games;
create trigger chess_games_updated_at
before update on public.chess_games
for each row execute procedure public.set_updated_at();

-- Index for fast "latest game" lookup in the widget
create index if not exists chess_games_user_updated
on public.chess_games (user_id, updated_at desc);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.chess_games enable row level security;

create policy "chess_games: select own"
on public.chess_games for select
using (auth.uid() = user_id);

create policy "chess_games: insert own"
on public.chess_games for insert
with check (auth.uid() = user_id);

create policy "chess_games: update own"
on public.chess_games for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chess_games: delete own"
on public.chess_games for delete
using (auth.uid() = user_id);