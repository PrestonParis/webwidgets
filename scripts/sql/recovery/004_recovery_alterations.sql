alter table recovery_profiles
    add column if not exists addiction text;

alter table recovery_profiles
    add column if not exists user_id uuid references auth.users(id);

-- NOTE: This is invalid SQL as written originally:
-- "create unique constraint if not exists" doesn't exist in Postgres
-- Correct version:
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'recovery_profiles_user_id_key'
    ) then
    alter table recovery_profiles
    add constraint recovery_profiles_user_id_key unique (user_id);
    end if;
end $$;

alter table urges
    add column if not exists tracker_id uuid references recovery_profiles(id);

alter table relapses
    add column if not exists tracker_id uuid references recovery_profiles(id);