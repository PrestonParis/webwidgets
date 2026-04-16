create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_journal_modtime on journals;

create trigger update_journal_modtime
before update on journals
for each row
execute procedure update_modified_column();