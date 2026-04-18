create index if not exists idx_journals_deleted_at
  on journals (deleted_at)
  where deleted_at is null;

create index if not exists idx_journals_created_month_day
  on journals (extract(month from created_at), extract(day from created_at));