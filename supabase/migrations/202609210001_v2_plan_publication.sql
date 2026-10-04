create function public.lock_v2_plan_graph_writer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    target_plan_id uuid;
    target_plan_ids uuid[];
begin
    if pg_trigger_depth() > 1 then
        return case when tg_op = 'DELETE' then old else new end;
    end if;
    target_plan_ids := case
        when tg_op = 'INSERT' then array[new.plan_id]
        when tg_op = 'DELETE' then array[old.plan_id]
        else array[old.plan_id,new.plan_id]
    end;
    for target_plan_id in
        select distinct candidate
        from unnest(target_plan_ids) candidate
        order by candidate
    loop
        perform pg_advisory_xact_lock(
            hashtextextended('v2-plan-publication:' || target_plan_id::text, 0)
        );
        update public.objective_plans
        set graph_hash = 'dirty:' || txid_current()::text || ':' || target_plan_id::text
        where id=target_plan_id and status='draft';
        if not found and exists (
            select 1 from public.objective_plans where id=target_plan_id
        ) then
            raise exception 'published objective plan children are immutable';
        end if;
    end loop;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger objective_plan_steps_publication_lock
before insert or update or delete on public.objective_plan_steps
for each row execute function public.lock_v2_plan_graph_writer();

create trigger objective_step_dependencies_publication_lock
before insert or update or delete on public.objective_step_dependencies
for each row execute function public.lock_v2_plan_graph_writer();

create function public.lock_v2_plan_hash_writer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    perform pg_advisory_xact_lock(
        hashtextextended('v2-plan-publication:' || old.id::text, 0)
    );
    return new;
end;
$$;

create trigger objective_plans_graph_hash_publication_lock
before update of graph_hash on public.objective_plans
for each row execute function public.lock_v2_plan_hash_writer();

create function public.lock_v2_plan_definition_writer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    perform pg_advisory_xact_lock(
        hashtextextended('v2-plan-publication:' || old.id::text, 0)
    );
    new.graph_hash := 'dirty:' || txid_current()::text || ':' || old.id::text;
    return new;
end;
$$;

create trigger objective_plans_definition_publication_lock
before update of objective_id,objective_version_id,user_id,version,maturity_level,
    planner_version,capability_registry_version,context_package_id,
    policy_snapshot_id,budget_snapshot,previous_plan_id,revision_reason
on public.objective_plans
for each row execute function public.lock_v2_plan_definition_writer();

create function public.publish_v2_objective_plan(
    p_plan_id uuid,
    p_user_id uuid,
    p_expected_graph_hash text
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
    target_plan public.objective_plans%rowtype;
    step_count integer;
    dependency_count integer;
    topologically_sorted_count integer;
    publication_time timestamptz;
begin
    if current_user not in ('postgres', 'service_role') then
        raise exception 'v2_plan_publication_forbidden';
    end if;
    perform pg_advisory_xact_lock(
        hashtextextended('v2-plan-publication:' || p_plan_id::text, 0)
    );
    select * into target_plan
    from public.objective_plans
    where id=p_plan_id and user_id=p_user_id
    for update;
    if not found then
        raise exception 'v2_plan_not_found';
    end if;
    if target_plan.graph_hash is distinct from p_expected_graph_hash then
        raise exception 'v2_plan_graph_hash_conflict';
    end if;
    if target_plan.status='published' then
        return jsonb_build_object(
            'planId',target_plan.id,'status','published',
            'publishedAt',target_plan.published_at,'reused',true
        );
    end if;
    if target_plan.status<>'draft' then
        raise exception 'v2_plan_not_draft';
    end if;

    select count(*) into step_count
    from public.objective_plan_steps where plan_id=target_plan.id;
    select count(*) into dependency_count
    from public.objective_step_dependencies where plan_id=target_plan.id;
    if step_count<1 or step_count>100 then
        raise exception 'v2_plan_step_limit_invalid';
    end if;
    if dependency_count>400 then
        raise exception 'v2_plan_dependency_limit_exceeded';
    end if;
    if exists (
        select 1
        from (
            select count(*) as total,count(distinct position) as distinct_total,
                   min(position) as first_position,max(position) as last_position
            from public.objective_plan_steps where plan_id=target_plan.id
        ) positions
        where positions.total<>positions.distinct_total
           or positions.first_position<>0
           or positions.last_position<>positions.total-1
    ) then
        raise exception 'v2_plan_positions_not_contiguous';
    end if;

    perform 1
    from public.automation_capability_versions capability
    join public.objective_plan_steps step
      on step.capability_name=capability.name
     and step.capability_version=capability.version
    where step.plan_id=target_plan.id
    order by capability.name,capability.version
    for share of capability;
    if exists (
        select 1 from public.objective_plan_steps step
        left join public.automation_capability_versions capability
          on capability.name=step.capability_name
         and capability.version=step.capability_version
        where step.plan_id=target_plan.id
          and capability.status is distinct from 'active'
    ) then
        raise exception 'v2_plan_capability_inactive';
    end if;
    with recursive topological_sort(remaining,removed) as (
        select array_agg(step.id order by step.id),0
        from public.objective_plan_steps step
        where step.plan_id=target_plan.id
        union all
        select array_remove(sort.remaining,next_step.id),sort.removed+1
        from topological_sort sort
        cross join lateral (
            select candidate.id
            from unnest(sort.remaining) candidate(id)
            where not exists (
                select 1
                from public.objective_step_dependencies dependency
                where dependency.plan_id=target_plan.id
                  and dependency.step_id=candidate.id
                  and dependency.depends_on_step_id=any(sort.remaining)
            )
            order by candidate.id
            limit 1
        ) next_step
        where cardinality(sort.remaining)>0
    )
    select max(removed) into topologically_sorted_count from topological_sort;
    if topologically_sorted_count<>step_count then
        raise exception 'v2_plan_dependency_cycle';
    end if;

    publication_time := now();
    update public.objective_versions
    set published_at=coalesce(objective_versions.published_at,publication_time)
    where id=target_plan.objective_version_id
      and objective_id=target_plan.objective_id
      and user_id=target_plan.user_id;
    update public.objective_plans
    set status='published',published_at=publication_time
    where id=target_plan.id;
    return jsonb_build_object(
        'planId',target_plan.id,'status','published',
        'publishedAt',publication_time,'reused',false
    );
end;
$$;

revoke all on function public.publish_v2_objective_plan(uuid,uuid,text)
    from public,anon,authenticated;
grant execute on function public.publish_v2_objective_plan(uuid,uuid,text)
    to service_role;
