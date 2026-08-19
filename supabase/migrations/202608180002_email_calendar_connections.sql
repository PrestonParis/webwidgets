-- Link provider credentials to canonical source connections and provide an
-- authenticated, atomic disconnect boundary.

alter table public.user_email_accounts
    add column if not exists integration_connection_id uuid;

create or replace function public.link_email_account_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    connection_id uuid;
    connection_scopes text[];
begin
    if new.provider = 'google' then
        select case
            when coalesce(tokens.has_calendar, false)
                then array['gmail.readonly', 'calendar.events']::text[]
            else array['gmail.readonly']::text[]
        end
        into connection_scopes
        from public.user_tokens as tokens
        where tokens.user_id = new.user_id;
        connection_scopes := coalesce(
            connection_scopes,
            array['gmail.readonly']::text[]
        );
    else
        connection_scopes := array['Mail.Read']::text[];
    end if;

    insert into public.integration_connections (
        user_id,
        provider_id,
        external_account_id,
        state,
        scopes,
        metadata,
        sync_status,
        next_sync_at,
        disabled_at,
        disconnected_at
    ) values (
        new.user_id,
        new.provider,
        lower(new.email),
        'connected',
        connection_scopes,
        jsonb_build_object('accountEmail', lower(new.email)),
        'scheduled',
        now(),
        null,
        null
    )
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
        updated_at = now()
    returning id into connection_id;

    new.integration_connection_id := connection_id;
    return new;
end;
$$;

drop trigger if exists link_email_account_connection_trigger
    on public.user_email_accounts;
create trigger link_email_account_connection_trigger
before insert on public.user_email_accounts
for each row execute function public.link_email_account_connection();

-- Existing accounts predate canonical connections. Reinsert their public
-- account identity through the trigger without exposing or rotating tokens.
with linked as (
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
        scopes = excluded.scopes,
        metadata = integration_connections.metadata || excluded.metadata
    returning id, user_id, provider_id, external_account_id
)
update public.user_email_accounts as accounts
set integration_connection_id = connections.id
from public.integration_connections as connections
where connections.user_id = accounts.user_id
  and connections.provider_id = accounts.provider
  and connections.external_account_id = lower(accounts.email)
  and accounts.integration_connection_id is null;

create unique index if not exists user_email_accounts_connection_unique
    on public.user_email_accounts(integration_connection_id)
    where integration_connection_id is not null;

alter table public.user_email_accounts
    add constraint user_email_accounts_connection_owner_fk
    foreign key (integration_connection_id, user_id)
    references public.integration_connections(id, user_id)
    on delete set null (integration_connection_id)
    not valid;

alter table public.user_email_accounts
    validate constraint user_email_accounts_connection_owner_fk;

create or replace function public.disconnect_provider_connection(
    connection_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
    affected integer;
begin
    update public.integration_connections
    set state = 'disconnected',
        sync_status = 'disconnected',
        disconnected_at = now(),
        next_sync_at = null,
        sync_error_code = null,
        sync_error_detail = null,
        updated_at = now()
    where id = connection_id
      and user_id = auth.uid()
      and provider_id in ('google', 'microsoft');

    get diagnostics affected = row_count;
    if affected = 0 then
        return false;
    end if;

    delete from public.user_email_accounts
    where integration_connection_id = connection_id
      and user_id = auth.uid();

    return true;
end;
$$;

revoke all on function public.disconnect_provider_connection(uuid) from public;
grant execute on function public.disconnect_provider_connection(uuid)
    to authenticated;

