/* This script sets up the database schema for the recovery tracking
feature. It includes two main tables:
Urges linked to specific recovery profiles (trackers) and Relapses also linked to trackers.
The recovery_profiles table is assumed to already exist from a previous migration, but we ensure it has 
*/

create table if not exists urges (
    id uuid primary key default gen_random_uuid(),
    tracker_id uuid references recovery_profiles(id) on delete cascade,
    intensity int check (intensity >= 1 and intensity <= 10),
    trigger text,
    created_at timestamptz default now()
);