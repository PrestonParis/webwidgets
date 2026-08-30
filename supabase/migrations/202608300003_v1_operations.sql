-- Content-free worker presence and a service-only V1 operational snapshot.

create table public.worker_runtime_heartbeats (
    instance_id text primary key,
    release_id text,
    ready boolean not null,
    redis_ready boolean not null,
    supabase_ready boolean not null,
    seen_at timestamptz not null default now(),
    started_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    constraint worker_runtime_heartbeats_instance_check
        check (length(instance_id) between 1 and 300),
    constraint worker_runtime_heartbeats_release_check
        check (release_id is null or length(release_id) between 1 and 300),
    constraint worker_runtime_heartbeats_metadata_check
        check (jsonb_typeof(metadata) = 'object')
);

create index worker_runtime_heartbeats_seen_idx
    on public.worker_runtime_heartbeats(seen_at desc);

alter table public.worker_runtime_heartbeats enable row level security;
revoke all on table public.worker_runtime_heartbeats from public, anon, authenticated;
grant select, insert, update, delete on table public.worker_runtime_heartbeats to service_role;

create or replace function public.get_v1_operations_snapshot()
returns jsonb
language sql
security definer
set search_path = ''
as $$
    with latest_worker as (
        select ready, redis_ready, supabase_ready, seen_at, release_id
        from public.worker_runtime_heartbeats
        order by seen_at desc
        limit 1
    ), job_metrics as (
        select
            count(*) filter (where status in ('queued', 'waiting')) as queue_depth,
            coalesce(max(extract(epoch from (now() - created_at))) filter
                (where status in ('queued', 'waiting')), 0)::bigint as oldest_queue_age_seconds,
            count(*) filter (where status = 'dead_lettered'
                and dead_lettered_at >= now() - interval '24 hours') as dead_letters_24h,
            count(*) filter (where status = 'failed'
                and updated_at >= now() - interval '24 hours') as failures_24h,
            count(*) filter (where status = 'completed'
                and completed_at >= now() - interval '24 hours') as completed_24h
        from public.jobs
    ), source_metrics as (
        select
            count(*) filter (where disabled_at is null and disconnected_at is null) as active,
            count(*) filter (where sync_status = 'degraded') as degraded,
            count(*) filter (where disconnected_at is not null or sync_status = 'disconnected') as disconnected,
            count(*) filter (where disabled_at is null and disconnected_at is null
                and next_sync_at < now() - interval '15 minutes') as overdue
        from public.integration_connections
    ), timeline_metrics as (
        select
            count(*) filter (where ingested_at >= now() - interval '24 hours') as events_24h,
            (select count(*) from (
                select user_id, idempotency_key
                from public.timeline_events
                group by user_id, idempotency_key
                having count(*) > 1
            ) duplicate_groups) as persisted_duplicate_groups
        from public.timeline_events
    ), inference_metrics as (
        select
            count(*) filter (where metadata->>'status' = 'failed'
                and created_at >= now() - interval '24 hours') as failures_24h,
            count(*) filter (where created_at >= now() - interval '24 hours') as requests_24h,
            coalesce((select round(sum(cost_usd)::numeric, 6)
                from public.cost_events
                where created_at >= now() - interval '24 hours'), 0) as estimated_cost_usd_24h
        from public.analytics_events
        where type = 'bounded_inference'
    ), briefing_metrics as (
        select
            count(*) filter (where status = 'failed'
                and created_at >= now() - interval '24 hours') as failures_24h,
            coalesce(round(avg(latency_ms) filter
                (where generated_at >= now() - interval '24 hours')), 0) as average_latency_ms,
            coalesce(round(sum(estimated_cost_usd) filter
                (where created_at >= now() - interval '24 hours'), 6), 0) as estimated_cost_usd_24h,
            (select count(*) from public.briefing_feedback where rating = 'useful'
                and created_at >= now() - interval '24 hours') as useful_feedback_24h,
            (select count(*) from public.briefing_feedback where rating in ('not_useful','incorrect')
                and created_at >= now() - interval '24 hours') as negative_feedback_24h
        from public.briefings
    ), candidate_metrics as (
        select
            count(*) filter (where state = 'dismissed'
                and updated_at >= now() - interval '24 hours') as dismissed_24h,
            count(*) filter (where state = 'failed'
                and updated_at >= now() - interval '24 hours') as failed_24h
        from public.candidate_actions
    ), action_metrics as (
        select
            count(*) filter (where status = 'succeeded'
                and completed_at >= now() - interval '24 hours') as succeeded_24h,
            count(*) filter (where status in ('failed', 'unknown')
                and completed_at >= now() - interval '24 hours') as failed_or_unknown_24h,
            count(*) filter (where attempt > 1
                and created_at >= now() - interval '24 hours') as replay_attempts_24h
        from public.action_results
    ), automation_metrics as (
        select
            count(*) filter (where status in ('failed', 'dead_lettered')
                and created_at >= now() - interval '24 hours') as failures_24h,
            count(*) filter (where status = 'cancelled'
                and created_at >= now() - interval '24 hours') as cancelled_24h,
            (select count(*) from public.automation_user_controls
                where pause_all = true) as users_paused,
            (select count(*) from public.automation_configs
                where state = 'paused') as configs_paused
        from public.automation_runs
    )
    select jsonb_build_object(
        'checkedAt', now(),
        'worker', jsonb_build_object(
            'healthy', coalesce((select ready and redis_ready and supabase_ready
                and seen_at >= now() - interval '90 seconds' from latest_worker), false),
            'lastSeenAt', (select seen_at from latest_worker),
            'ready', coalesce((select ready from latest_worker), false),
            'redis', coalesce((select redis_ready from latest_worker), false),
            'supabase', coalesce((select supabase_ready from latest_worker), false),
            'releaseId', (select release_id from latest_worker),
            'activeInstances', (select count(*) from public.worker_runtime_heartbeats
                where seen_at >= now() - interval '90 seconds')
        ),
        'jobs', to_jsonb(job_metrics),
        'sources', to_jsonb(source_metrics),
        'timeline', to_jsonb(timeline_metrics),
        'inference', to_jsonb(inference_metrics),
        'briefings', to_jsonb(briefing_metrics),
        'candidates', to_jsonb(candidate_metrics),
        'actions', to_jsonb(action_metrics),
        'automations', to_jsonb(automation_metrics)
    )
    from job_metrics, source_metrics, timeline_metrics, inference_metrics,
        briefing_metrics, candidate_metrics, action_metrics, automation_metrics;
$$;

revoke all on function public.get_v1_operations_snapshot() from public, anon, authenticated;
grant execute on function public.get_v1_operations_snapshot() to service_role;
