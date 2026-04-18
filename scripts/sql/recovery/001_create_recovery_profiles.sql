/* This file contains the SQL schema for the recovery tracking feature. It defines the 
necessary tables and relationships to support user-created recovery profiles (trackers) 
and their associated urges. */

create table recovery_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    addiction text not null,
    start_time timestamptz not null, 
    created_at timestamptz default now()
);