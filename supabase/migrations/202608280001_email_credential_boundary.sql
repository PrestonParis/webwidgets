-- Preserve existing credential rows while removing every browser secret path.
alter table public.user_email_accounts
    add column granted_scopes text[] not null default '{}',
    add column provider_subject text;
alter table public.user_tokens add column microsoft_email text,
    add column microsoft_expires_at bigint;

revoke all on public.user_tokens, public.user_email_accounts from public, anon, authenticated;
do $$
declare c record;
begin
    for c in select table_name, column_name from information_schema.columns
        where table_schema = 'public' and table_name in ('user_tokens', 'user_email_accounts')
    loop
        execute format('revoke all (%I) on public.%I from public, anon, authenticated', c.column_name, c.table_name);
    end loop;
end;
$$;
grant select (user_id, has_calendar, has_drive, has_gmail, has_microsoft, updated_at)
    on public.user_tokens to authenticated;
grant select (id, user_id, provider, email, display_name, integration_connection_id,
    granted_scopes, created_at, updated_at, last_synced_at)
    on public.user_email_accounts to authenticated;
grant all on public.user_tokens, public.user_email_accounts to service_role;

drop policy if exists "Users can manage own tokens" on public.user_tokens;
create policy "Owner reads connection flags" on public.user_tokens for select
    to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can manage own email accounts" on public.user_email_accounts;
create policy "Owner reads account metadata" on public.user_email_accounts for select
    to authenticated using (auth.uid() = user_id);
alter table public.user_tokens enable row level security;
alter table public.user_email_accounts enable row level security;

create table public.oauth_connection_attempts (
    state_hash text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null check (provider in ('google', 'microsoft')),
    redirect_path text not null,
    code_verifier text,
    expires_at timestamptz not null default (now() + interval '10 minutes')
);
alter table public.oauth_connection_attempts enable row level security;
revoke all on public.oauth_connection_attempts from public, anon, authenticated;
grant all on public.oauth_connection_attempts to service_role;
create policy "Service manages OAuth attempts" on public.oauth_connection_attempts
    to service_role using (true) with check (true);

create function public.consume_oauth_connection_attempt(
    p_state_hash text, p_user_id uuid, p_provider text
) returns setof public.oauth_connection_attempts
language sql security definer set search_path = '' as $$
    delete from public.oauth_connection_attempts
    where state_hash = p_state_hash and user_id = p_user_id
      and provider = p_provider and expires_at > now()
    returning *;
$$;
revoke all on function public.consume_oauth_connection_attempt(text, uuid, text) from public, anon, authenticated;
grant execute on function public.consume_oauth_connection_attempt(text, uuid, text) to service_role;

-- Reconnecting may change capabilities, but token refresh must not reactivate
-- a disabled connection or invent scopes from another account's legacy flags.
create or replace function public.link_email_account_connection()
returns trigger language plpgsql security definer set search_path = '' as $$
declare connection_id uuid;
begin
    insert into public.integration_connections (
        user_id, provider_id, external_account_id, state, scopes, metadata,
        sync_status, next_sync_at, disabled_at, disconnected_at
    ) values (
        new.user_id, new.provider, lower(new.email), 'connected', new.granted_scopes,
        jsonb_build_object('accountEmail', lower(new.email)), 'scheduled', now(), null, null
    ) on conflict (user_id, provider_id, external_account_id) do update set
        state = 'connected', scopes = excluded.scopes,
        metadata = integration_connections.metadata || excluded.metadata,
        sync_status = 'scheduled', next_sync_at = now(), disabled_at = null,
        disconnected_at = null, sync_error_code = null, sync_error_detail = null,
        updated_at = now()
    returning id into connection_id;
    new.integration_connection_id := connection_id;
    return new;
end;
$$;

-- Browser writes are now revoked; retain disconnect through a scoped RPC.
create or replace function public.disconnect_provider_connection(connection_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer; account record;
begin
    update public.integration_connections set state = 'disconnected',
        sync_status = 'disconnected', disconnected_at = now(), next_sync_at = null,
        sync_error_code = null, sync_error_detail = null, updated_at = now()
    where id = connection_id and user_id = auth.uid()
      and provider_id in ('google', 'microsoft');
    get diagnostics affected = row_count;
    if affected = 0 then return false; end if;
    for account in select provider, email from public.user_email_accounts
        where integration_connection_id = connection_id and user_id = auth.uid()
    loop
        if account.provider = 'google' then
            update public.user_tokens set access_token = '', refresh_token = null,
                expires_at = null, has_gmail = false, has_calendar = false,
                has_drive = false, gmail_email = null, watch_expiry = null
            where user_id = auth.uid() and (gmail_email is null or lower(gmail_email) = lower(account.email));
        else
            update public.user_tokens set microsoft_access_token = null,
                microsoft_refresh_token = null, has_microsoft = false,
                microsoft_email = null, microsoft_expires_at = null
            where user_id = auth.uid() and (microsoft_email is null or lower(microsoft_email) = lower(account.email));
        end if;
    end loop;
    delete from public.user_email_accounts
    where integration_connection_id = connection_id and user_id = auth.uid();
    return true;
end;
$$;
revoke all on function public.disconnect_provider_connection(uuid) from public, anon;
grant execute on function public.disconnect_provider_connection(uuid) to authenticated;
