-- Close the owner-isolation gap on append-only import/export diagnostics.

alter table public.import_job_logs enable row level security;
alter table public.export_job_logs enable row level security;

drop policy if exists "import_job_logs_owner_select" on public.import_job_logs;
create policy "import_job_logs_owner_select"
on public.import_job_logs
for select
to authenticated
using (
    exists (
        select 1
        from public.import_jobs
        where import_jobs.id = import_job_logs.import_job_id
          and import_jobs.user_id = auth.uid()
    )
);

drop policy if exists "import_job_logs_owner_insert" on public.import_job_logs;
create policy "import_job_logs_owner_insert"
on public.import_job_logs
for insert
to authenticated
with check (
    exists (
        select 1
        from public.import_jobs
        where import_jobs.id = import_job_logs.import_job_id
          and import_jobs.user_id = auth.uid()
    )
);

drop policy if exists "export_job_logs_owner_select" on public.export_job_logs;
create policy "export_job_logs_owner_select"
on public.export_job_logs
for select
to authenticated
using (
    exists (
        select 1
        from public.export_jobs
        where export_jobs.id = export_job_logs.export_job_id
          and export_jobs.user_id = auth.uid()
    )
);

drop policy if exists "export_job_logs_owner_insert" on public.export_job_logs;
create policy "export_job_logs_owner_insert"
on public.export_job_logs
for insert
to authenticated
with check (
    exists (
        select 1
        from public.export_jobs
        where export_jobs.id = export_job_logs.export_job_id
          and export_jobs.user_id = auth.uid()
    )
);

revoke all on table public.import_job_logs from anon, authenticated;
revoke all on table public.export_job_logs from anon, authenticated;
grant select, insert on table public.import_job_logs to authenticated;
grant select, insert on table public.export_job_logs to authenticated;
grant all on table public.import_job_logs to service_role;
grant all on table public.export_job_logs to service_role;
