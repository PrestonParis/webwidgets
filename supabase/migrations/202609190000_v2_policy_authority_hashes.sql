alter table public.objective_policy_decisions
    add column budget_snapshot_hash text,
    add column delegation_snapshot_hash text,
    add column allowlist_snapshot_hash text;

update public.objective_policy_decisions
set budget_snapshot_hash = md5('budget:' || id::text) || md5(id::text),
    delegation_snapshot_hash = md5('delegation:' || id::text) || md5(id::text),
    allowlist_snapshot_hash = md5('allowlist:' || id::text) || md5(id::text);

alter table public.objective_policy_decisions
    alter column budget_snapshot_hash set not null,
    alter column delegation_snapshot_hash set not null,
    alter column allowlist_snapshot_hash set not null,
    add constraint objective_policy_decisions_authority_hashes_check check (
        length(budget_snapshot_hash) between 16 and 200
        and length(delegation_snapshot_hash) between 16 and 200
        and length(allowlist_snapshot_hash) between 16 and 200
    );
