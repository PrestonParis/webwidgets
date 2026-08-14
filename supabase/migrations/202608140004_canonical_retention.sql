-- Content minimization and operational diagnostic retention for ADR-010.

create or replace function public.set_job_diagnostics_expiry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        if new.status in ('failed', 'dead_lettered') then
            new.diagnostics_expires_at = now() + interval '90 days';
        elsif new.status in ('completed', 'cancelled') then
            new.diagnostics_expires_at = now() + interval '30 days';
        end if;
    elsif new.status is distinct from old.status then
        if new.status in ('failed', 'dead_lettered') then
            new.diagnostics_expires_at = now() + interval '90 days';
        elsif new.status in ('completed', 'cancelled') then
            new.diagnostics_expires_at = now() + interval '30 days';
        end if;
    end if;
    return new;
end;
$$;

revoke all on function public.set_job_diagnostics_expiry() from public, anon, authenticated;

create trigger jobs_set_diagnostics_expiry
    before insert or update of status on public.jobs
    for each row execute function public.set_job_diagnostics_expiry();

create or replace function public.purge_expired_v1_lifecycle(
    p_now timestamptz default now()
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
    raw_payloads integer := 0;
    insight_contents integer := 0;
    candidate_contents integer := 0;
    action_payloads integer := 0;
    action_outputs integer := 0;
    job_diagnostics integer := 0;
    timeline_rows integer := 0;
begin
    update public.raw_observations
    set payload = '{}'::jsonb,
        payload_cleared_at = p_now,
        failure_detail = null
    where payload_cleared_at is null
      and normalized_at is not null
      and payload_expires_at <= p_now;
    get diagnostics raw_payloads = row_count;

    update public.insights
    set summary = '',
        content_cleared_at = p_now,
        failure_detail = null,
        metadata = '{}'::jsonb
    where content_cleared_at is null
      and state in ('dismissed', 'expired', 'superseded', 'failed')
      and expires_at + interval '30 days' <= p_now;
    get diagnostics insight_contents = row_count;

    update public.candidate_actions
    set payload = '{}'::jsonb,
        content_cleared_at = p_now,
        failure_detail = null,
        metadata = '{}'::jsonb
    where content_cleared_at is null
      and state in ('denied', 'expired', 'dismissed', 'completed', 'failed')
      and expires_at + interval '30 days' <= p_now;
    get diagnostics candidate_contents = row_count;

    update public.action_requests
    set payload = '{}'::jsonb,
        approved_payload = case
            when approved_payload is null then null
            else '{}'::jsonb
        end,
        failure_detail = null
    where expires_at <= p_now
      and (payload <> '{}'::jsonb or approved_payload <> '{}'::jsonb);
    get diagnostics action_payloads = row_count;

    update public.action_results
    set output = case when output is null then null else '{}'::jsonb end,
        failure_detail = null,
        metadata = '{}'::jsonb,
        compensation_metadata = '{}'::jsonb
    where expires_at <= p_now
      and (
          output is distinct from '{}'::jsonb
          or failure_detail is not null
          or metadata <> '{}'::jsonb
          or compensation_metadata <> '{}'::jsonb
      );
    get diagnostics action_outputs = row_count;

    delete from public.job_logs as log
    using public.jobs as job
    where log.job_id = job.id
      and job.diagnostics_expires_at <= p_now;
    get diagnostics job_diagnostics = row_count;

    update public.jobs
    set source_references = '[]'::jsonb,
        user_visible_result = null,
        metadata = '{}'::jsonb,
        failure_reason = null,
        failure_detail = null
    where diagnostics_expires_at <= p_now
      and (
          source_references <> '[]'::jsonb
          or user_visible_result is not null
          or metadata <> '{}'::jsonb
          or failure_reason is not null
          or failure_detail is not null
      );

    delete from public.timeline_events
    where expires_at <= p_now;
    get diagnostics timeline_rows = row_count;

    return jsonb_build_object(
        'rawPayloadsCleared', raw_payloads,
        'insightContentsCleared', insight_contents,
        'candidateContentsCleared', candidate_contents,
        'actionPayloadsCleared', action_payloads,
        'actionOutputsCleared', action_outputs,
        'jobDiagnosticsDeleted', job_diagnostics,
        'timelineRowsDeleted', timeline_rows
    );
end;
$$;

revoke all on function public.purge_expired_v1_lifecycle(timestamptz)
    from public, anon, authenticated;
grant execute on function public.purge_expired_v1_lifecycle(timestamptz)
    to service_role;
