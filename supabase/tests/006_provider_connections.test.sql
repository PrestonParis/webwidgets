begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email)
values
    ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'provider-one@example.invalid'),
    ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'provider-two@example.invalid');

insert into public.user_tokens (
    user_id, access_token, has_gmail, has_calendar, has_microsoft
) values
    ('11111111-1111-4111-8111-111111111111', 'google-token', true, true, false),
    ('22222222-2222-4222-8222-222222222222', 'microsoft-token', false, false, true);

insert into public.user_email_accounts (
    id, user_id, provider, email, access_token
) values
    ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'google', 'one@example.invalid', 'google-token'),
    ('10000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'microsoft', 'two@example.invalid', 'microsoft-token');

select results_eq(
    $$select count(*)::bigint from public.user_email_accounts where integration_connection_id is not null$$,
    $$values (2::bigint)$$,
    'provider credentials are linked to canonical connections'
);
select results_eq(
    $$select scopes from public.integration_connections where user_id = '11111111-1111-4111-8111-111111111111'$$,
    $$values (array['gmail.readonly', 'calendar.events']::text[])$$,
    'Google connection records only the granted V1 mail and calendar scopes'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq(
    $$select count(*)::bigint from public.integration_connections where provider_id in ('google', 'microsoft')$$,
    $$values (1::bigint)$$,
    'provider connection health is isolated between users'
);
select is(
    public.disconnect_provider_connection(
        (select id from public.integration_connections where provider_id = 'microsoft')
    ),
    false,
    'a user cannot disconnect another user provider connection'
);
select is(
    public.disconnect_provider_connection(
        (select id from public.integration_connections where provider_id = 'google')
    ),
    true,
    'the owner can disconnect a provider connection'
);
select results_eq(
    $$select count(*)::bigint from public.user_email_accounts$$,
    $$values (0::bigint)$$,
    'disconnect removes the owner credential row from their RLS view'
);
select results_eq(
    $$select count(*)::bigint from public.integration_connections where disconnected_at is not null and next_sync_at is null$$,
    $$values (1::bigint)$$,
    'disconnect preserves history ownership and removes future scheduling'
);

reset role;
select * from finish();
rollback;

