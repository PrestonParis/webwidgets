-- The original backfill used an INSERT CTE followed by an UPDATE. PostgreSQL
-- executes both against one snapshot, so the UPDATE could not see connections
-- inserted by its sibling CTE. Keep the operations in separate statements.

insert into public.integration_connections (
    user_id,
    provider_id,
    external_account_id,
    state,
    scopes,
    metadata,
    sync_status,
    next_sync_at
)
select
    accounts.user_id,
    accounts.provider,
    lower(accounts.email),
    'connected',
    case
        when accounts.provider = 'google'
             and coalesce(tokens.has_calendar, false)
            then array['gmail.readonly', 'calendar.events']::text[]
        when accounts.provider = 'google'
            then array['gmail.readonly']::text[]
        else array['Mail.Read']::text[]
    end,
    jsonb_build_object('accountEmail', lower(accounts.email)),
    'scheduled',
    now()
from public.user_email_accounts as accounts
left join public.user_tokens as tokens on tokens.user_id = accounts.user_id
on conflict (user_id, provider_id, external_account_id)
do update set
    state = 'connected',
    scopes = excluded.scopes,
    metadata = integration_connections.metadata || excluded.metadata,
    sync_status = 'scheduled',
    next_sync_at = now(),
    disabled_at = null,
    disconnected_at = null,
    sync_error_code = null,
    sync_error_detail = null,
    updated_at = now();

update public.user_email_accounts as accounts
set integration_connection_id = connections.id
from public.integration_connections as connections
where connections.user_id = accounts.user_id
  and connections.provider_id = accounts.provider
  and connections.external_account_id = lower(accounts.email)
  and accounts.integration_connection_id is null;

do $$
begin
    if exists (
        select 1
        from public.user_email_accounts
        where integration_connection_id is null
    ) then
        raise exception 'Provider credential backfill left unlinked accounts';
    end if;
end;
$$;
