create table public.automation_capability_versions (
    name text not null,
    version text not null,
    definition_hash text not null,
    status text not null default 'active',
    registered_at timestamptz not null default now(),
    retired_at timestamptz,
    primary key (name, version),
    constraint automation_capability_versions_name_check check (
        name ~ '^[a-z0-9][a-z0-9_.-]+$' and length(name) <= 240
    ),
    constraint automation_capability_versions_version_check check (
        version ~ '^[1-9][0-9]*$' and length(version) <= 200
    ),
    constraint automation_capability_versions_hash_check check (
        definition_hash ~ '^[a-f0-9]{64}$'
    ),
    constraint automation_capability_versions_status_check check (
        status in ('active', 'retired')
    ),
    constraint automation_capability_versions_retired_check check (
        (status = 'active' and retired_at is null)
        or (status = 'retired' and retired_at is not null)
    )
);

insert into public.automation_capability_versions(name, version, definition_hash)
values
    ('tasks.create', '1', '29b499596a05cd60b0f060a7707c1e198b6863a773ad7b26b0efed3eedca71cb'),
    ('tasks.update', '1', '1587a764c17d7a19eaf899d2f0239276ad703bd47fdb5681bc1e1025160edba9'),
    ('tasks.complete', '1', '104276336687c1c3b94c53f5a9efcee0f46fb0c831daa3572406a79f941f452e'),
    ('calendar.create_event', '1', '1d36c6e5c4aa1220a1063b941f7fd8a7a902bf536cbd60c31029df390a3b254b'),
    ('email.draft', '1', '41be79f62f241118b3ec37cb3757028de69465bc1c6a0a09513ec0d58cf8b659');

alter table public.automation_capability_versions enable row level security;
revoke all on table public.automation_capability_versions from public, anon, authenticated;
grant select, insert, update on table public.automation_capability_versions to service_role;

alter table public.objective_plan_steps
    add constraint objective_plan_steps_capability_version_fk
    foreign key (capability_name, capability_version)
    references public.automation_capability_versions(name, version)
    not valid;

create function public.guard_active_automation_capability_version()
returns trigger language plpgsql set search_path = '' as $$
begin
    if tg_op = 'UPDATE'
       and new.capability_name = old.capability_name
       and new.capability_version = old.capability_version then
        return new;
    end if;
    if not exists (
        select 1
        from public.automation_capability_versions capability
        where capability.name = new.capability_name
          and capability.version = new.capability_version
          and capability.status = 'active'
    ) then
        raise exception 'active_capability_version_not_found';
    end if;
    return new;
end;
$$;

create trigger objective_plan_steps_active_capability_guard
    before insert or update of capability_name, capability_version
    on public.objective_plan_steps
    for each row execute function public.guard_active_automation_capability_version();

create function public.guard_published_plan_capabilities()
returns trigger language plpgsql set search_path = '' as $$
begin
    if new.status <> 'published'
       or (tg_op = 'UPDATE' and old.status = 'published') then
        return new;
    end if;
    perform 1
    from public.automation_capability_versions capability
    join public.objective_plan_steps step
      on step.capability_name = capability.name
     and step.capability_version = capability.version
    where step.plan_id = new.id
    order by capability.name, capability.version
    for share of capability;
    if exists (
        select 1
        from public.objective_plan_steps step
        left join public.automation_capability_versions capability
          on capability.name = step.capability_name
         and capability.version = step.capability_version
        where step.plan_id = new.id
          and (capability.status is distinct from 'active')
    ) then
        raise exception 'plan_contains_inactive_capability_version';
    end if;
    return new;
end;
$$;

create trigger objective_plans_active_capability_guard
    before insert or update of status on public.objective_plans
    for each row execute function public.guard_published_plan_capabilities();

create function public.guard_automation_capability_version()
returns trigger language plpgsql set search_path = '' as $$
begin
    if tg_op = 'DELETE' then
        raise exception 'capability versions must be retired, not deleted';
    end if;
    if new.name <> old.name
       or new.version <> old.version
       or new.definition_hash <> old.definition_hash
       or new.registered_at <> old.registered_at then
        raise exception 'capability version definitions are immutable';
    end if;
    if new.status = old.status and new.retired_at is not distinct from old.retired_at then
        return new;
    end if;
    if old.status <> 'active' or new.status <> 'retired' or new.retired_at is null then
        raise exception 'invalid capability version transition';
    end if;
    if exists (
        select 1
        from public.objective_plan_steps step
        join public.objective_plans plan on plan.id = step.plan_id
        join public.objectives objective on objective.id = step.objective_id
        where step.capability_name = old.name
          and step.capability_version = old.version
          and plan.status = 'published'
          and objective.status in (
              'draft', 'submitted', 'active', 'paused', 'blocked',
              'cancel_requested'
          )
    ) then
        raise exception 'capability_version_in_active_plan';
    end if;
    return new;
end;
$$;

create trigger automation_capability_versions_guard
    before update or delete on public.automation_capability_versions
    for each row execute function public.guard_automation_capability_version();

create function public.retire_automation_capability_version(
    p_name text,
    p_version text
) returns public.automation_capability_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
    retired public.automation_capability_versions%rowtype;
begin
    update public.automation_capability_versions
    set status = 'retired', retired_at = now()
    where name = p_name and version = p_version and status = 'active'
    returning * into retired;
    if not found then
        raise exception 'active_capability_version_not_found';
    end if;
    return retired;
end;
$$;

revoke all on function public.retire_automation_capability_version(text, text)
    from public, anon, authenticated;
grant execute on function public.retire_automation_capability_version(text, text)
    to service_role;
