-- Atomic credential persistence prevents partial reconnects and preserves the
-- other provider's legacy mirror until all legacy readers are retired.
create function public.store_verified_provider_credentials(
    p_user_id uuid, p_provider text, p_email text, p_subject text, p_scopes text[],
    p_access_token text, p_refresh_token text, p_expires_at bigint
) returns void language plpgsql security definer set search_path = '' as $$
declare existing_subject text;
begin
    if p_provider not in ('google', 'microsoft') or nullif(p_subject, '') is null
       or nullif(p_access_token, '') is null or nullif(p_email, '') is null then
        raise exception 'invalid_provider_credentials';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_provider || ':' || lower(p_email), 0));
    select provider_subject into existing_subject from public.user_email_accounts
    where user_id = p_user_id and provider = p_provider and email = lower(p_email);
    if existing_subject is not null and existing_subject <> p_subject then
        raise exception 'provider_account_identity_changed';
    end if;
    insert into public.user_email_accounts (
        user_id, provider, email, provider_subject, granted_scopes,
        access_token, refresh_token, expires_at
    ) values (
        p_user_id, p_provider, lower(p_email), p_subject, p_scopes,
        p_access_token, p_refresh_token, p_expires_at
    ) on conflict (user_id, provider, email) do update set
        provider_subject = excluded.provider_subject, granted_scopes = excluded.granted_scopes,
        access_token = excluded.access_token,
        refresh_token = coalesce(excluded.refresh_token, user_email_accounts.refresh_token),
        expires_at = excluded.expires_at, updated_at = now();

    if p_provider = 'google' then
        insert into public.user_tokens (user_id, access_token, refresh_token, expires_at,
            has_gmail, has_calendar, has_drive, gmail_email)
        values (p_user_id, p_access_token, p_refresh_token, p_expires_at,
            p_scopes && array['gmail.readonly','gmail.modify','gmail.compose','https://mail.google.com/'],
            p_scopes && array['calendar','calendar.events'],
            p_scopes && array['drive','drive.readonly','drive.file'], lower(p_email))
        on conflict (user_id) do update set access_token = excluded.access_token,
            refresh_token = coalesce(excluded.refresh_token,
                case when lower(user_tokens.gmail_email) = lower(p_email) then user_tokens.refresh_token end),
            expires_at = excluded.expires_at, has_gmail = excluded.has_gmail,
            has_calendar = excluded.has_calendar, has_drive = excluded.has_drive,
            gmail_email = excluded.gmail_email;
    else
        insert into public.user_tokens (user_id, access_token, has_microsoft,
            microsoft_access_token, microsoft_refresh_token, microsoft_email, microsoft_expires_at)
        values (p_user_id, '', true, p_access_token, p_refresh_token, lower(p_email), p_expires_at)
        on conflict (user_id) do update set has_microsoft = true,
            microsoft_access_token = excluded.microsoft_access_token,
            microsoft_refresh_token = coalesce(excluded.microsoft_refresh_token,
                case when lower(user_tokens.microsoft_email) = lower(p_email) then user_tokens.microsoft_refresh_token end),
            microsoft_email = excluded.microsoft_email,
            microsoft_expires_at = excluded.microsoft_expires_at;
    end if;
end;
$$;
revoke all on function public.store_verified_provider_credentials(uuid,text,text,text,text[],text,text,bigint)
    from public, anon, authenticated;
grant execute on function public.store_verified_provider_credentials(uuid,text,text,text,text[],text,text,bigint)
    to service_role;
