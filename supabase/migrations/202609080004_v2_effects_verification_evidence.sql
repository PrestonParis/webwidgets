create table public.objective_external_effects (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null,
    run_id uuid not null,
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    action_request_id uuid,
    action_result_id uuid,
    provider_id text not null,
    provider_execution_id text,
    idempotency_key text not null,
    payload_hash text not null,
    state text not null default 'reserved',
    reservation_expires_at timestamptz not null,
    dispatched_at timestamptz,
    accepted_at timestamptz,
    verified_at timestamptz,
    last_error jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint objective_external_effects_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_external_effects_idempotency_unique
        unique (user_id, provider_id, idempotency_key),
    constraint objective_external_effects_attempt_owner_fk
        foreign key (attempt_id, run_id, objective_id, user_id)
        references public.objective_step_attempts(id, run_id, objective_id, user_id)
        on delete cascade,
    constraint objective_external_effects_request_owner_fk
        foreign key (action_request_id, user_id)
        references public.action_requests(id, user_id),
    constraint objective_external_effects_result_owner_fk
        foreign key (action_result_id, user_id)
        references public.action_results(id, user_id),
    constraint objective_external_effects_state_check check (
        state in (
            'reserved', 'dispatched', 'accepted', 'verified', 'unknown',
            'compensating', 'compensated', 'failed'
        )
    ),
    constraint objective_external_effects_content_check check (
        length(provider_id) between 1 and 200
        and length(idempotency_key) between 1 and 500
        and length(payload_hash) between 16 and 200
    )
);

create unique index objective_external_effects_provider_unique
    on public.objective_external_effects(user_id, provider_id, provider_execution_id)
    where provider_execution_id is not null;
create index objective_external_effects_state_idx
    on public.objective_external_effects(user_id, state, updated_at);

create table public.objective_verification_results (
    id uuid primary key default gen_random_uuid(),
    effect_id uuid not null,
    objective_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    verifier_name text not null,
    verifier_version text not null,
    status text not null,
    observed_state jsonb not null default '{}'::jsonb,
    observed_state_hash text not null,
    reason_codes text[] not null default '{}',
    verified_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint objective_verification_results_id_objective_user_unique
        unique (id, objective_id, user_id),
    constraint objective_verification_results_effect_owner_fk
        foreign key (effect_id, objective_id, user_id)
        references public.objective_external_effects(id, objective_id, user_id)
        on delete cascade,
    constraint objective_verification_results_status_check check (
        status in ('verified', 'mismatched', 'unverifiable', 'unknown')
    ),
    constraint objective_verification_results_content_check check (
        length(verifier_name) between 1 and 240
        and length(verifier_version) between 1 and 200
        and length(observed_state_hash) between 16 and 200
    )
);

create table public.objective_execution_evidence (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null,
    run_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    evidence_type text not null,
    subject_type text not null,
    subject_id uuid not null,
    content jsonb not null,
    content_hash text not null,
    source text not null,
    recorded_at timestamptz not null default now(),
    retention_expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    constraint objective_execution_evidence_run_owner_fk
        foreign key (run_id, objective_id, user_id)
        references public.objective_runs(id, objective_id, user_id)
        on delete cascade,
    constraint objective_execution_evidence_type_check check (
        evidence_type in (
            'plan_snapshot', 'policy_decision', 'approval', 'step_result',
            'external_receipt', 'verification', 'completion', 'failure'
        )
    ),
    constraint objective_execution_evidence_subject_check check (
        subject_type in ('objective', 'plan', 'run', 'step', 'attempt', 'effect')
    ),
    constraint objective_execution_evidence_content_check check (
        length(content_hash) between 16 and 200
        and length(source) between 1 and 240
        and retention_expires_at > recorded_at
    )
);

create index objective_verification_results_effect_idx
    on public.objective_verification_results(effect_id, verified_at desc);
create index objective_execution_evidence_objective_idx
    on public.objective_execution_evidence(objective_id, recorded_at);
create index objective_execution_evidence_retention_idx
    on public.objective_execution_evidence(retention_expires_at);

alter table public.objective_external_effects enable row level security;
alter table public.objective_verification_results enable row level security;
alter table public.objective_execution_evidence enable row level security;

create policy objective_external_effects_read on public.objective_external_effects
    for select to authenticated using (user_id = auth.uid());
create policy objective_verification_results_read on public.objective_verification_results
    for select to authenticated using (user_id = auth.uid());
create policy objective_execution_evidence_read on public.objective_execution_evidence
    for select to authenticated using (user_id = auth.uid());

revoke all on table public.objective_external_effects,
    public.objective_verification_results, public.objective_execution_evidence
    from anon, authenticated;
grant select on table public.objective_external_effects,
    public.objective_verification_results, public.objective_execution_evidence
    to authenticated;
grant all on table public.objective_external_effects,
    public.objective_verification_results, public.objective_execution_evidence
    to service_role;

create trigger objective_external_effects_set_updated_at
    before update on public.objective_external_effects
    for each row execute function public.set_updated_at();
