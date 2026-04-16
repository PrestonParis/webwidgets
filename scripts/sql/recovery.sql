-- 1. Recovery Profiles (The Trackers)
create table recovery_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    addiction text not null, -- Missing in your old script
    start_time timestamptz not null, 
    created_at timestamptz default now()
);

-- 2. Urges (Linked to a specific tracker)
create table urges (
    id uuid primary key default gen_random_uuid(),
    tracker_id uuid references recovery_profiles(id) on delete cascade, -- Crucial for filtering
    intensity int check (intensity >= 1 and intensity <= 10),
    trigger text,
    created_at timestamptz default now()
);

-- 3. Relapses (Linked to a specific tracker)
create table relapses (
    id uuid primary key default gen_random_uuid(),
    tracker_id uuid references recovery_profiles(id) on delete cascade,
    relapsed_at timestamptz default now(), -- Matches your frontend logic
    note text
);

-- 1. Create an immutable function to extract Month and Day
CREATE OR REPLACE FUNCTION get_month_day(ts timestamptz) 
RETURNS text AS $$
  -- We hardcode 'UTC' (or your preferred zone) to make it immutable
  SELECT to_char(ts AT TIME ZONE 'UTC', 'MM-DD');
$$ LANGUAGE sql IMMUTABLE;

-- 2. Create the index using the function
CREATE INDEX IF NOT EXISTS idx_journals_month_day 
ON journals (get_month_day(created_at));

-- 3. Add the rest of your requested columns
ALTER TABLE journals 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Simple index for soft-deletes
CREATE INDEX IF NOT EXISTS idx_journals_deleted_at ON journals (deleted_at);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journal_modtime
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Add soft delete support
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add optional cover image
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Index for soft-delete queries (exclude trashed entries by default)
CREATE INDEX IF NOT EXISTS idx_journals_deleted_at
  ON journals (deleted_at)
  WHERE deleted_at IS NULL;

-- On This Day helper index
CREATE INDEX IF NOT EXISTS idx_journals_created_month_day
  ON journals (EXTRACT(MONTH FROM created_at), EXTRACT(DAY FROM created_at));

create table email_cache (
  user_id     text primary key,
  emails      jsonb not null default '[]',
  predictions jsonb not null default '{}',
  fetched_at  timestamptz not null default now()
);