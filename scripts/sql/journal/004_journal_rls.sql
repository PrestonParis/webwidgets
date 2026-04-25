alter table public.journals
alter column user_id type uuid
using user_id::uuid;

-- 1. Enable RLS
alter table public.journals enable row level security;

-- 2. Create Policies
create policy "Users can view their own non-deleted journals"
    on public.journals for select
    using ( auth.uid() = user_id and deleted_at is null );

create policy "Users can insert their own journals"
    on public.journals for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own journals"
    on public.journals for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own journals"
    on public.journals for delete
    using ( auth.uid() = user_id );