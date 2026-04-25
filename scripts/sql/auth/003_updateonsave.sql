-- This SQL script creates a trigger to automatically update the `updated_at` column in the `profiles` table whenever a record is updated. This ensures that the timestamp reflects the last modification time without requiring manual updates to the `updated_at` field.
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_profiles_modtime
before update on public.profiles
for each row execute procedure update_modified_column();