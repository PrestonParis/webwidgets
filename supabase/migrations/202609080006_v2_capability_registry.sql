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
    ('tasks.create', '1', 'a4b509058e3156ef8676bf7e7f77c36fe4ddaa0346b439800b1d891bfeae11cf'),
    ('tasks.update', '1', 'a7633d0b4c2c83afcd331b86801ab0a22f62f5179682603cabcc5716af00ab9f'),
    ('tasks.complete', '1', 'c449aa0cd88d286e9a1192698621a9ab40b48b99789bbd15809ed5934cfbc022'),
    ('calendar.create_event', '1', '8c38cbc4754a0ebad5d4cf92eff651b3677af89cedd24a90ce2b3f4792e94ab8'),
    ('email.draft', '1', '95a46be20e445bce283d0d3e37c6ec1813864d6e240ecce7664edb4937ac6aba');

alter table public.automation_capability_versions enable row level security;
revoke all on table public.automation_capability_versions from public, anon, authenticated;
grant select, insert, update on table public.automation_capability_versions to service_role;

alter table public.objective_plan_steps
    add constraint objective_plan_steps_capability_version_fk
    foreign key (capability_name, capability_version)
    references public.automation_capability_versions(name, version)
    not valid;

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
              'submitted', 'active', 'paused', 'blocked', 'cancel_requested'
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
