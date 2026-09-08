alter table public.collaboration_workspaces
    add constraint collaboration_workspaces_id_user_unique unique (id, user_id);

create table public.objectives (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    workspace_id uuid,
    client_request_key text not null,
    title text not null,
    maturity_level smallint not null,
    status text not null default 'draft',
    state_version integer not null default 1,
    deadline_at timestamptz,
    submitted_at timestamptz,
    completed_at timestamptz,
    cancellation_requested_at timestamptz,
    cancellation_reason text,
    archived_at timestamptz,
    retention_expires_at timestamptz not null default (now() + interval '365 days'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint objectives_id_user_unique unique (id, user_id),
    constraint objectives_client_request_unique unique (user_id, client_request_key),
    constraint objectives_workspace_owner_fk
        foreign key (workspace_id, user_id)
        references public.collaboration_workspaces(id, user_id)
        on delete set null (workspace_id),
    constraint objectives_maturity_check check (maturity_level between 1 and 4),
    constraint objectives_state_version_check check (state_version >= 1),
    constraint objectives_status_check check (
        status in (
            'draft', 'submitted', 'active', 'paused', 'blocked',
            'cancel_requested', 'cancelled', 'completed', 'failed', 'archived'
        )
    ),
    constraint objectives_terminal_time_check check (
        status not in ('cancelled', 'completed', 'failed') or completed_at is not null
    ),
    constraint objectives_cancellation_check check (
        status <> 'cancel_requested' or cancellation_requested_at is not null
    ),
    constraint objectives_content_check check (
        length(client_request_key) between 1 and 300
        and length(title) between 1 and 500
        and (cancellation_reason is null or length(cancellation_reason) <= 2000)
    )
);

create table public.objective_versions (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    version integer not null,
    intent text not null,
    scope jsonb not null default '{}'::jsonb,
    expected_outputs jsonb not null default '[]'::jsonb,
    success_conditions jsonb not null default '[]'::jsonb,
    failure_conditions jsonb not null default '[]'::jsonb,
    stop_conditions jsonb not null default '[]'::jsonb,
    permitted_capabilities jsonb not null default '[]'::jsonb,
    permitted_source_classes text[] not null default '{}',
    policy_version text not null,
    content_hash text not null,
    published_at timestamptz,
    superseded_at timestamptz,
    created_at timestamptz not null default now(),
    constraint objective_versions_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_versions_number_unique unique (objective_id, version),
    constraint objective_versions_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_versions_version_check check (version >= 1),
    constraint objective_versions_content_check check (
        length(intent) between 1 and 8000
        and length(policy_version) between 1 and 200
        and length(content_hash) between 16 and 200
    ),
    constraint objective_versions_superseded_check check (
        superseded_at is null or published_at is not null
    )
);

create table public.objective_plans (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    objective_version_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    version integer not null,
    maturity_level smallint not null,
    status text not null default 'draft',
    planner_version text not null,
    capability_registry_version text not null,
    context_package_id uuid,
    policy_snapshot_id uuid,
    budget_snapshot jsonb not null default '{}'::jsonb,
    graph_hash text not null,
    previous_plan_id uuid,
    revision_reason text,
    published_at timestamptz,
    superseded_at timestamptz,
    created_at timestamptz not null default now(),
    constraint objective_plans_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_plans_number_unique unique (objective_id, version),
    constraint objective_plans_objective_owner_fk
        foreign key (objective_id, user_id)
        references public.objectives(id, user_id)
        on delete cascade,
    constraint objective_plans_version_owner_fk
        foreign key (objective_version_id, objective_id, user_id)
        references public.objective_versions(id, objective_id, user_id),
    constraint objective_plans_previous_owner_fk
        foreign key (previous_plan_id, objective_id, user_id)
        references public.objective_plans(id, objective_id, user_id),
    constraint objective_plans_version_check check (version >= 1),
    constraint objective_plans_maturity_check check (maturity_level between 1 and 4),
    constraint objective_plans_status_check check (
        status in ('draft', 'published', 'superseded', 'invalidated')
    ),
    constraint objective_plans_publish_check check (
        status <> 'published' or published_at is not null
    ),
    constraint objective_plans_superseded_check check (
        status <> 'superseded' or superseded_at is not null
    ),
    constraint objective_plans_content_check check (
        length(planner_version) between 1 and 200
        and length(capability_registry_version) between 1 and 200
        and length(graph_hash) between 16 and 200
        and (revision_reason is null or length(revision_reason) <= 2000)
    )
);

create table public.objective_plan_steps (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null,
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    step_key text not null,
    position integer not null,
    capability_name text not null,
    capability_version text not null,
    risk_class text not null,
    input jsonb not null default '{}'::jsonb,
    input_hash text not null,
    expected_postconditions jsonb not null default '[]'::jsonb,
    retry_policy jsonb not null default '{}'::jsonb,
    timeout_seconds integer not null,
    idempotency_scope text not null,
    created_at timestamptz not null default now(),
    constraint objective_plan_steps_id_plan_objective_user_unique
        unique (id, plan_id, objective_id, user_id),
    constraint objective_plan_steps_key_unique unique (plan_id, step_key),
    constraint objective_plan_steps_position_unique unique (plan_id, position),
    constraint objective_plan_steps_plan_owner_fk
        foreign key (plan_id, objective_id, user_id)
        references public.objective_plans(id, objective_id, user_id)
        on delete cascade,
    constraint objective_plan_steps_position_check check (position >= 0),
    constraint objective_plan_steps_timeout_check check (timeout_seconds between 1 and 86400),
    constraint objective_plan_steps_risk_check check (
        risk_class in (
            'read', 'draft', 'reversible_write', 'external',
            'sensitive', 'destructive', 'prohibited'
        )
    ),
    constraint objective_plan_steps_content_check check (
        length(step_key) between 1 and 200
        and length(capability_name) between 1 and 240
        and length(capability_version) between 1 and 200
        and length(input_hash) between 16 and 200
        and length(idempotency_scope) between 1 and 300
    )
);

create table public.objective_step_dependencies (
    plan_id uuid not null,
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    step_id uuid not null,
    depends_on_step_id uuid not null,
    condition jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    primary key (step_id, depends_on_step_id),
    constraint objective_step_dependencies_step_owner_fk
        foreign key (step_id, plan_id, objective_id, user_id)
        references public.objective_plan_steps(id, plan_id, objective_id, user_id)
        on delete cascade,
    constraint objective_step_dependencies_parent_owner_fk
        foreign key (depends_on_step_id, plan_id, objective_id, user_id)
        references public.objective_plan_steps(id, plan_id, objective_id, user_id)
        on delete cascade,
    constraint objective_step_dependencies_not_self_check check (step_id <> depends_on_step_id)
);

create index objectives_status_idx
    on public.objectives(user_id, status, updated_at desc);
create index objectives_workspace_idx
    on public.objectives(workspace_id, updated_at desc) where workspace_id is not null;
create index objective_versions_objective_idx
    on public.objective_versions(objective_id, version desc);
create index objective_plans_objective_idx
    on public.objective_plans(objective_id, version desc);
create index objective_plan_steps_capability_idx
    on public.objective_plan_steps(capability_name, capability_version);
create index objective_step_dependencies_plan_idx
    on public.objective_step_dependencies(plan_id, step_id);

alter table public.objectives enable row level security;
alter table public.objective_versions enable row level security;
alter table public.objective_plans enable row level security;
alter table public.objective_plan_steps enable row level security;
alter table public.objective_step_dependencies enable row level security;

create policy objectives_own on public.objectives
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy objective_versions_own on public.objective_versions
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy objective_plans_own on public.objective_plans
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy objective_plan_steps_own on public.objective_plan_steps
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy objective_step_dependencies_own on public.objective_step_dependencies
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.objectives, public.objective_versions,
    public.objective_plans, public.objective_plan_steps,
    public.objective_step_dependencies from anon, authenticated;
grant select, insert, update, delete on table public.objectives,
    public.objective_versions, public.objective_plans,
    public.objective_plan_steps, public.objective_step_dependencies to authenticated;
grant all on table public.objectives, public.objective_versions,
    public.objective_plans, public.objective_plan_steps,
    public.objective_step_dependencies to service_role;

create trigger objectives_set_updated_at before update on public.objectives
    for each row execute function public.set_updated_at();
