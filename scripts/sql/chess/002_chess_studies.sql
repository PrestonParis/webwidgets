-- ─────────────────────────────────────────────
-- chess_studies
-- A study is a named collection of positions/variations
-- used for training (e.g. "Sicilian Defense", "Endgame Technique")
-- ─────────────────────────────────────────────
create table if not exists public.chess_studies (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    title       text not null,
    description text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

drop trigger if exists chess_studies_updated_at on public.chess_studies;
create trigger chess_studies_updated_at
    before update on public.chess_studies
    for each row execute procedure public.set_updated_at();

create index if not exists chess_studies_user
    on public.chess_studies (user_id, updated_at desc);

alter table public.chess_studies enable row level security;

create policy "chess_studies: select own" on public.chess_studies for select using (auth.uid() = user_id);
create policy "chess_studies: insert own" on public.chess_studies for insert with check (auth.uid() = user_id);
create policy "chess_studies: update own" on public.chess_studies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chess_studies: delete own" on public.chess_studies for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- chess_variations
-- A variation is a sequence of moves (stored as PGN)
-- branching from a starting FEN position.
-- Belongs to either a game (for review annotations)
-- OR a study (for move trainer drills).
-- ─────────────────────────────────────────────
create table if not exists public.chess_variations (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,

    -- Belongs to a game review OR a study (at least one must be set)
    game_id     uuid references public.chess_games(id) on delete cascade,
    study_id    uuid references public.chess_studies(id) on delete cascade,

    -- Human-readable label for this variation
    title       text not null default 'Variation',

    -- FEN of the position where this variation starts
    start_fen   text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',

    -- Move index in the parent game where this variation branches (null for studies)
    branch_move_index integer,

    -- The variation moves as a PGN string (just the moves, no headers)
    pgn         text not null,

    -- Optional annotation / explanation shown during training
    annotation  text,

    -- Move trainer state: how many times practiced, last result
    practiced_count integer not null default 0,
    last_practiced  timestamptz,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    constraint variation_has_parent check (game_id is not null or study_id is not null)
);

drop trigger if exists chess_variations_updated_at on public.chess_variations;
create trigger chess_variations_updated_at
    before update on public.chess_variations
    for each row execute procedure public.set_updated_at();

create index if not exists chess_variations_game    on public.chess_variations (game_id);
create index if not exists chess_variations_study   on public.chess_variations (study_id);
create index if not exists chess_variations_user    on public.chess_variations (user_id);

alter table public.chess_variations enable row level security;

create policy "chess_variations: select own" on public.chess_variations for select using (auth.uid() = user_id);
create policy "chess_variations: insert own" on public.chess_variations for insert with check (auth.uid() = user_id);
create policy "chess_variations: update own" on public.chess_variations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chess_variations: delete own" on public.chess_variations for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Add last_viewed_at to chess_games
-- Used by the widget to pick the most recently VIEWED game
-- (not just the most recently imported one)
-- ─────────────────────────────────────────────
alter table public.chess_games
    add column if not exists last_viewed_at timestamptz;

-- Update the widget index to use last_viewed_at
drop index if exists chess_games_user_updated;
create index if not exists chess_games_user_viewed
    on public.chess_games (user_id, coalesce(last_viewed_at, updated_at) desc);