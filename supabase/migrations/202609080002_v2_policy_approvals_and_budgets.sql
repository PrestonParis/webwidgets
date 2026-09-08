create table public.objective_budgets (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    objective_version_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    version integer not null default 1,
    status text not null default 'active',
    max_attempts integer not null,
    max_provider_calls integer not null,
    max_model_tokens bigint not null,
    max_cost_microunits bigint not null,
    max_active_seconds integer not null,
    attempts_used integer not null default 0,
    provider_calls_used integer not null default 0,
    model_tokens_used bigint not null default 0,
    cost_microunits_used bigint not null default 0,
    active_seconds_used integer not null default 0,
    additional_limits jsonb not null default '{}'::jsonb,
    exhausted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint objective_budgets_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_budgets_version_unique unique (objective_id, version),
    constraint objective_budgets_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_budgets_version_owner_fk
        foreign key (objective_version_id, objective_id, user_id)
        references public.objective_versions(id, objective_id, user_id),
    constraint objective_budgets_version_check check (version >= 1),
    constraint objective_budgets_status_check check (status in ('active', 'exhausted', 'closed')),
    constraint objective_budgets_limits_check check (
        max_attempts >= 1
        and max_provider_calls >= 0
        and max_model_tokens >= 0
        and max_cost_microunits >= 0
        and max_active_seconds >= 1
    ),
    constraint objective_budgets_usage_check check (
        attempts_used between 0 and max_attempts
        and provider_calls_used between 0 and max_provider_calls
        and model_tokens_used between 0 and max_model_tokens
        and cost_microunits_used between 0 and max_cost_microunits
        and active_seconds_used between 0 and max_active_seconds
    ),
    constraint objective_budgets_exhausted_check check (
        status <> 'exhausted' or exhausted_at is not null
    )
);

create table public.objective_policy_decisions (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    plan_id uuid,
    step_id uuid,
    budget_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    capability_name text,
    capability_version text,
    risk_class text not null,
    normalized_payload jsonb not null default '{}'::jsonb,
    payload_hash text not null,
    policy_version text not null,
    consent_snapshot_hash text not null,
    connection_snapshot_hash text not null,
    decision text not null,
    reason_codes text[] not null default '{}',
    requires_approval boolean not null default false,
    evaluated_at timestamptz not null default now(),
    expires_at timestamptz not null,
    constraint objective_policy_decisions_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_policy_decisions_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_policy_decisions_plan_owner_fk
        foreign key (plan_id, objective_id, user_id)
        references public.objective_plans(id, objective_id, user_id),
    constraint objective_policy_decisions_step_owner_fk
        foreign key (step_id, plan_id, objective_id, user_id)
        references public.objective_plan_steps(id, plan_id, objective_id, user_id),
    constraint objective_policy_decisions_budget_owner_fk
        foreign key (budget_id, objective_id, user_id)
        references public.objective_budgets(id, objective_id, user_id),
    constraint objective_policy_decisions_step_plan_check check (
        step_id is null or plan_id is not null
    ),
    constraint objective_policy_decisions_decision_check check (
        decision in ('allow', 'deny', 'require_approval')
    ),
    constraint objective_policy_decisions_approval_check check (
        requires_approval = (decision = 'require_approval')
    ),
    constraint objective_policy_decisions_risk_check check (
        risk_class in (
            'read', 'draft', 'reversible_write', 'external',
            'sensitive', 'destructive', 'prohibited'
        )
    ),
    constraint objective_policy_decisions_content_check check (
        length(payload_hash) between 16 and 200
        and length(policy_version) between 1 and 200
        and length(consent_snapshot_hash) between 16 and 200
        and length(connection_snapshot_hash) between 16 and 200
        and (capability_name is null or length(capability_name) between 1 and 240)
        and (capability_version is null or length(capability_version) between 1 and 200)
    ),
    constraint objective_policy_decisions_expiry_check check (expires_at > evaluated_at)
);

create table public.objective_approvals (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    plan_id uuid not null,
    step_id uuid not null,
    policy_decision_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    payload jsonb not null,
    payload_hash text not null,
    payload_version integer not null,
    status text not null default 'pending',
    decided_by uuid references auth.users(id) on delete set null,
    decided_payload jsonb,
    decided_payload_hash text,
    decided_payload_version integer,
    requested_at timestamptz not null default now(),
    decided_at timestamptz,
    expires_at timestamptz not null,
    constraint objective_approvals_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_approvals_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_approvals_plan_owner_fk
        foreign key (plan_id, objective_id, user_id)
        references public.objective_plans(id, objective_id, user_id),
    constraint objective_approvals_step_owner_fk
        foreign key (step_id, plan_id, objective_id, user_id)
        references public.objective_plan_steps(id, plan_id, objective_id, user_id),
    constraint objective_approvals_policy_owner_fk
        foreign key (policy_decision_id, objective_id, user_id)
        references public.objective_policy_decisions(id, objective_id, user_id),
    constraint objective_approvals_version_check check (payload_version >= 1),
    constraint objective_approvals_status_check check (
        status in ('pending', 'approved', 'denied', 'expired', 'revoked')
    ),
    constraint objective_approvals_decision_check check (
        (status = 'pending' and decided_at is null and decided_by is null)
        or (
            status <> 'pending'
            and decided_at is not null
            and (status in ('expired', 'revoked') or decided_by is not null)
        )
    ),
    constraint objective_approvals_decider_owner_check check (
        decided_by is null or decided_by = user_id
    ),
    constraint objective_approvals_exact_payload_check check (
        status <> 'approved'
        or (
            decided_payload is not null
            and decided_payload_hash = payload_hash
            and decided_payload_version = payload_version
            and decided_payload = payload
        )
    ),
    constraint objective_approvals_content_check check (
        length(payload_hash) between 16 and 200
        and (decided_payload_hash is null or length(decided_payload_hash) between 16 and 200)
    ),
    constraint objective_approvals_expiry_check check (expires_at > requested_at)
);

create index objective_budgets_status_idx
    on public.objective_budgets(user_id, status, updated_at desc);
create index objective_policy_decisions_objective_idx
    on public.objective_policy_decisions(objective_id, evaluated_at desc);
create index objective_policy_decisions_step_idx
    on public.objective_policy_decisions(step_id, evaluated_at desc) where step_id is not null;
create index objective_approvals_pending_idx
    on public.objective_approvals(user_id, requested_at) where status = 'pending';
create unique index objective_approvals_pending_unique
    on public.objective_approvals(step_id, payload_version) where status = 'pending';

alter table public.objective_budgets enable row level security;
alter table public.objective_policy_decisions enable row level security;
alter table public.objective_approvals enable row level security;

create policy objective_budgets_read on public.objective_budgets
    for select to authenticated using (user_id = auth.uid());
create policy objective_policy_decisions_read on public.objective_policy_decisions
    for select to authenticated using (user_id = auth.uid());
create policy objective_approvals_read on public.objective_approvals
    for select to authenticated using (user_id = auth.uid());

revoke all on table public.objective_budgets,
    public.objective_policy_decisions, public.objective_approvals
    from anon, authenticated;
grant select on table public.objective_budgets,
    public.objective_policy_decisions, public.objective_approvals to authenticated;
grant all on table public.objective_budgets,
    public.objective_policy_decisions, public.objective_approvals to service_role;

create trigger objective_budgets_set_updated_at
    before update on public.objective_budgets
    for each row execute function public.set_updated_at();
