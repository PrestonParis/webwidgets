create table public.objective_runs (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    plan_id uuid not null,
    budget_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    automation_run_id uuid,
    job_id uuid,
    run_number integer not null,
    status text not null default 'queued',
    ownership_epoch bigint not null default 1,
    lease_owner text,
    lease_expires_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    cancellation_requested_at timestamptz,
    failure_code text,
    failure_detail jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint objective_runs_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_runs_number_unique unique (objective_id, run_number),
    constraint objective_runs_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_runs_plan_owner_fk
        foreign key (plan_id, objective_id, user_id)
        references public.objective_plans(id, objective_id, user_id),
    constraint objective_runs_budget_owner_fk
        foreign key (budget_id, objective_id, user_id)
        references public.objective_budgets(id, objective_id, user_id),
    constraint objective_runs_automation_owner_fk
        foreign key (automation_run_id, user_id)
        references public.automation_runs(id, user_id),
    constraint objective_runs_job_owner_fk
        foreign key (job_id, user_id)
        references public.jobs(id, user_id),
    constraint objective_runs_number_check check (run_number >= 1),
    constraint objective_runs_epoch_check check (ownership_epoch >= 1),
    constraint objective_runs_status_check check (
        status in (
            'queued', 'leased', 'running', 'paused', 'blocked',
            'cancel_requested', 'cancelled', 'succeeded', 'failed'
        )
    ),
    constraint objective_runs_lease_check check (
        (lease_owner is null and lease_expires_at is null)
        or (lease_owner is not null and lease_expires_at is not null)
    ),
    constraint objective_runs_terminal_check check (
        status not in ('cancelled', 'succeeded', 'failed') or completed_at is not null
    )
);

create table public.objective_step_attempts (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null,
    plan_id uuid not null,
    objective_id uuid not null,
    step_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    attempt_number integer not null,
    idempotency_key text not null,
    executor_version text not null,
    status text not null default 'queued',
    ownership_epoch bigint not null,
    lease_owner text,
    lease_expires_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    failure_code text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint objective_step_attempts_id_run_objective_user_unique
        unique (id, run_id, objective_id, user_id),
    constraint objective_step_attempts_number_unique
        unique (run_id, step_id, attempt_number),
    constraint objective_step_attempts_idempotency_unique
        unique (user_id, idempotency_key),
    constraint objective_step_attempts_run_owner_fk
        foreign key (run_id, objective_id, user_id)
        references public.objective_runs(id, objective_id, user_id)
        on delete cascade,
    constraint objective_step_attempts_step_owner_fk
        foreign key (step_id, plan_id, objective_id, user_id)
        references public.objective_plan_steps(id, plan_id, objective_id, user_id),
    constraint objective_step_attempts_number_check check (attempt_number >= 1),
    constraint objective_step_attempts_epoch_check check (ownership_epoch >= 1),
    constraint objective_step_attempts_status_check check (
        status in ('queued', 'leased', 'running', 'succeeded', 'failed', 'cancelled')
    ),
    constraint objective_step_attempts_lease_check check (
        (lease_owner is null and lease_expires_at is null)
        or (lease_owner is not null and lease_expires_at is not null)
    ),
    constraint objective_step_attempts_terminal_check check (
        status not in ('succeeded', 'failed', 'cancelled') or completed_at is not null
    ),
    constraint objective_step_attempts_content_check check (
        length(idempotency_key) between 1 and 500
        and length(executor_version) between 1 and 200
    )
);

create table public.objective_step_results (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null,
    run_id uuid not null,
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null,
    output jsonb,
    output_hash text,
    error_code text,
    error_detail jsonb,
    provider_execution_id text,
    started_at timestamptz not null,
    completed_at timestamptz not null,
    created_at timestamptz not null default now(),
    constraint objective_step_results_attempt_unique unique (attempt_id),
    constraint objective_step_results_attempt_owner_fk
        foreign key (attempt_id, run_id, objective_id, user_id)
        references public.objective_step_attempts(id, run_id, objective_id, user_id)
        on delete cascade,
    constraint objective_step_results_status_check check (
        status in ('succeeded', 'failed', 'cancelled', 'unknown')
    ),
    constraint objective_step_results_time_check check (completed_at >= started_at),
    constraint objective_step_results_output_check check (
        (status = 'succeeded' and output is not null and output_hash is not null)
        or status <> 'succeeded'
    )
);

create index objective_runs_status_idx
    on public.objective_runs(user_id, status, created_at);
create index objective_step_attempts_status_idx
    on public.objective_step_attempts(run_id, status, attempt_number);
create index objective_step_results_provider_idx
    on public.objective_step_results(provider_execution_id)
    where provider_execution_id is not null;

alter table public.objective_runs enable row level security;
alter table public.objective_step_attempts enable row level security;
alter table public.objective_step_results enable row level security;

create policy objective_runs_read on public.objective_runs
    for select to authenticated using (user_id = auth.uid());
create policy objective_step_attempts_read on public.objective_step_attempts
    for select to authenticated using (user_id = auth.uid());
create policy objective_step_results_read on public.objective_step_results
    for select to authenticated using (user_id = auth.uid());

revoke all on table public.objective_runs, public.objective_step_attempts,
    public.objective_step_results from anon, authenticated;
grant select on table public.objective_runs, public.objective_step_attempts,
    public.objective_step_results to authenticated;
grant all on table public.objective_runs, public.objective_step_attempts,
    public.objective_step_results to service_role;

create trigger objective_runs_set_updated_at
    before update on public.objective_runs
    for each row execute function public.set_updated_at();
create trigger objective_step_attempts_set_updated_at
    before update on public.objective_step_attempts
    for each row execute function public.set_updated_at();
