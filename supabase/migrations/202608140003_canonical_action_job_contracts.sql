-- Evolve the existing job, automation, request, and result ledgers in place.

alter table public.jobs
    add column if not exists idempotency_key text,
    add column if not exists correlation_id text,
    add column if not exists queue_name text,
    add column if not exists queue_job_id text,
    add column if not exists available_at timestamptz,
    add column if not exists started_at timestamptz,
    add column if not exists completed_at timestamptz,
    add column if not exists dead_lettered_at timestamptz,
    add column if not exists max_attempts integer not null default 3,
    add column if not exists failure_code text,
    add column if not exists failure_detail text,
    add column if not exists diagnostics_expires_at timestamptz not null default (now() + interval '30 days');

alter table public.jobs
    add constraint jobs_id_user_unique unique (id, user_id),
    add constraint jobs_max_attempts_check check (max_attempts >= 1) not valid,
    add constraint jobs_retry_count_check check (retry_count >= 0) not valid,
    add constraint jobs_status_check check (
        status in ('queued', 'running', 'waiting', 'completed', 'failed', 'cancelled', 'dead_lettered')
    ) not valid;

create unique index jobs_user_idempotency_unique
    on public.jobs(user_id, idempotency_key)
    where idempotency_key is not null;
create unique index jobs_queue_identity_unique
    on public.jobs(queue_name, queue_job_id)
    where queue_name is not null and queue_job_id is not null;
create index jobs_dispatch_idx
    on public.jobs(status, available_at, created_at)
    where status = 'queued';
create index jobs_diagnostics_expiry_idx
    on public.jobs(diagnostics_expires_at);

alter table public.automation_runs
    add column if not exists trigger_timeline_event_id uuid,
    add column if not exists job_id uuid,
    add column if not exists idempotency_key text,
    add column if not exists policy_version text,
    add column if not exists failure_code text,
    add column if not exists failure_detail text,
    add column if not exists updated_at timestamptz not null default now(),
    add column if not exists expires_at timestamptz not null default (now() + interval '365 days');

alter table public.automation_runs
    add constraint automation_runs_id_user_unique unique (id, user_id),
    add constraint automation_runs_trigger_event_owner_fk
        foreign key (trigger_timeline_event_id, user_id)
        references public.timeline_events(id, user_id)
        on delete set null (trigger_timeline_event_id),
    add constraint automation_runs_job_owner_fk
        foreign key (job_id, user_id)
        references public.jobs(id, user_id)
        on delete set null (job_id),
    add constraint automation_runs_status_check check (
        status in ('queued', 'running', 'waiting_for_approval', 'completed', 'failed', 'skipped', 'cancelled')
    ) not valid;

create unique index automation_runs_user_idempotency_unique
    on public.automation_runs(user_id, idempotency_key)
    where idempotency_key is not null;
create index automation_runs_timeline_idx
    on public.automation_runs(user_id, trigger_timeline_event_id)
    where trigger_timeline_event_id is not null;

alter table public.action_requests
    add column if not exists candidate_action_id uuid,
    add column if not exists automation_run_id uuid,
    add column if not exists job_id uuid,
    add column if not exists idempotency_key text,
    add column if not exists payload_hash text,
    add column if not exists payload_version integer,
    add column if not exists approved_payload jsonb,
    add column if not exists approved_payload_hash text,
    add column if not exists approved_payload_version integer,
    add column if not exists policy_version text,
    add column if not exists permission_snapshot_hash text,
    add column if not exists requested_at timestamptz,
    add column if not exists decided_at timestamptz,
    add column if not exists approved_at timestamptz,
    add column if not exists denied_at timestamptz,
    add column if not exists execution_started_at timestamptz,
    add column if not exists execution_completed_at timestamptz,
    add column if not exists expires_at timestamptz not null default (now() + interval '365 days'),
    add column if not exists state_version integer not null default 1,
    add column if not exists failure_code text,
    add column if not exists failure_detail text;

update public.action_requests
set requested_at = created_at,
    payload_version = 1
where requested_at is null or payload_version is null;

alter table public.action_requests
    alter column requested_at set not null,
    alter column requested_at set default now(),
    alter column payload_version set not null,
    alter column payload_version set default 1,
    add constraint action_requests_id_user_unique unique (id, user_id),
    add constraint action_requests_candidate_owner_fk
        foreign key (candidate_action_id, user_id)
        references public.candidate_actions(id, user_id)
        on delete set null (candidate_action_id),
    add constraint action_requests_automation_owner_fk
        foreign key (automation_run_id, user_id)
        references public.automation_runs(id, user_id)
        on delete set null (automation_run_id),
    add constraint action_requests_job_owner_fk
        foreign key (job_id, user_id)
        references public.jobs(id, user_id)
        on delete set null (job_id),
    add constraint action_requests_payload_version_check check (payload_version >= 1) not valid,
    add constraint action_requests_state_version_check check (state_version >= 1) not valid,
    add constraint action_requests_approval_state_check check (
        approval_state in ('not_required', 'required', 'approved', 'denied')
    ) not valid,
    add constraint action_requests_status_check check (
        status in ('pending', 'deferred', 'queued', 'running', 'completed', 'failed', 'cancelled')
    ) not valid,
    add constraint action_requests_approved_payload_check check (
        approval_state <> 'approved'
        or (
            approved_payload is not null
            and approved_payload_hash is not null
            and approved_payload_version is not null
            and approved_at is not null
        )
    ) not valid,
    add constraint action_requests_denied_at_check check (
        approval_state <> 'denied' or denied_at is not null
    ) not valid;

create unique index action_requests_user_idempotency_unique
    on public.action_requests(user_id, idempotency_key)
    where idempotency_key is not null;
create index action_requests_review_queue_idx
    on public.action_requests(user_id, approval_state, requested_at desc)
    where approval_state = 'required';
create index action_requests_candidate_idx
    on public.action_requests(user_id, candidate_action_id)
    where candidate_action_id is not null;

alter table public.action_results
    add column if not exists user_id uuid,
    add column if not exists job_id uuid,
    add column if not exists idempotency_key text,
    add column if not exists attempt integer,
    add column if not exists status text,
    add column if not exists provider_id text,
    add column if not exists provider_execution_id text,
    add column if not exists output jsonb,
    add column if not exists result_hash text,
    add column if not exists failure_code text,
    add column if not exists failure_detail text,
    add column if not exists verification_status text,
    add column if not exists verified_at timestamptz,
    add column if not exists undo_status text,
    add column if not exists compensation_metadata jsonb not null default '{}'::jsonb,
    add column if not exists started_at timestamptz,
    add column if not exists completed_at timestamptz,
    add column if not exists updated_at timestamptz not null default now(),
    add column if not exists expires_at timestamptz not null default (now() + interval '365 days');

update public.action_results as result
set user_id = request.user_id,
    status = case when result.ok then 'succeeded' else 'failed' end
from public.action_requests as request
where request.id = result.action_request_id
  and (result.user_id is null or result.status is null);

with ranked_results as (
    select id,
           row_number() over (
               partition by action_request_id
               order by created_at, id
           ) as assigned_attempt
    from public.action_results
    where attempt is null
)
update public.action_results as result
set attempt = ranked_results.assigned_attempt
from ranked_results
where result.id = ranked_results.id;

alter table public.action_results
    alter column user_id set not null,
    alter column attempt set not null,
    alter column attempt set default 1,
    alter column status set not null,
    add constraint action_results_id_user_unique unique (id, user_id),
    add constraint action_results_request_owner_fk
        foreign key (action_request_id, user_id)
        references public.action_requests(id, user_id)
        on delete cascade,
    add constraint action_results_job_owner_fk
        foreign key (job_id, user_id)
        references public.jobs(id, user_id)
        on delete set null (job_id),
    add constraint action_results_attempt_unique unique (action_request_id, attempt),
    add constraint action_results_attempt_check check (attempt >= 1) not valid,
    add constraint action_results_hash_check check (
        result_hash is null or length(result_hash) between 16 and 200
    ) not valid,
    add constraint action_results_status_check check (
        status in ('started', 'succeeded', 'failed', 'cancelled', 'unknown')
    ) not valid,
    add constraint action_results_verification_check check (
        verification_status is null
        or verification_status in ('pending', 'verified', 'mismatched', 'unverifiable')
    ) not valid,
    add constraint action_results_verified_at_check check (
        verification_status <> 'verified' or verified_at is not null
    ) not valid,
    add constraint action_results_undo_status_check check (
        undo_status is null
        or undo_status in ('not_available', 'available', 'requested', 'completed', 'failed')
    ) not valid;

create unique index action_results_user_idempotency_unique
    on public.action_results(user_id, idempotency_key)
    where idempotency_key is not null;
create unique index action_results_provider_execution_unique
    on public.action_results(user_id, provider_id, provider_execution_id)
    where provider_id is not null and provider_execution_id is not null;
create index action_results_request_idx
    on public.action_results(user_id, action_request_id, attempt desc);

drop policy if exists "action_results_own" on public.action_results;
create policy "action_results_own" on public.action_results
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger automation_runs_set_updated_at
    before update on public.automation_runs
    for each row execute function public.set_updated_at();
create trigger action_results_set_updated_at
    before update on public.action_results
    for each row execute function public.set_updated_at();

revoke all on table public.jobs from anon, authenticated;
revoke all on table public.automation_runs from anon, authenticated;
revoke all on table public.action_requests from anon, authenticated;
revoke all on table public.action_results from anon, authenticated;
grant select, insert, update, delete on table public.jobs to authenticated;
grant select, insert, update, delete on table public.automation_runs to authenticated;
grant select, insert, update, delete on table public.action_requests to authenticated;
grant select, insert, update, delete on table public.action_results to authenticated;
grant all on table public.jobs to service_role;
grant all on table public.automation_runs to service_role;
grant all on table public.action_requests to service_role;
grant all on table public.action_results to service_role;
