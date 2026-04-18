/* 
    This script creates the "relapses" table to track relapse events linked to recovery profiles.
    Each relapse has a timestamp and an optional note for additional context.
*/

create table if not exists relapses (
    id uuid primary key default gen_random_uuid(),
    tracker_id uuid references recovery_profiles(id) on delete cascade,
    relapsed_at timestamptz default now(),
    note text
);