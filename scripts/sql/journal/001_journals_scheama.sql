alter table journals
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz default null,
  add column if not exists image_url text default null,
  add column if not exists metadata jsonb default '{}';