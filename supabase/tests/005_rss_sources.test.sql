begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email)
values
    ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rss-one@example.invalid'),
    ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rss-two@example.invalid');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

insert into public.integration_connections (
    id, user_id, provider_id, external_account_id, source_url,
    source_url_hash, state, sync_status, next_sync_at
) values (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111', 'rss', repeat('a', 64),
    'https://example.com/feed.xml', repeat('a', 64), 'connected',
    'scheduled', now()
);

select throws_ok(
    $$insert into public.integration_connections (user_id, provider_id, external_account_id, source_url, source_url_hash) values ('11111111-1111-4111-8111-111111111111', 'rss', repeat('a', 64), 'https://example.com/feed.xml', repeat('a', 64))$$,
    '23505', null, 'the same owner cannot add the same canonical feed twice'
);

select throws_ok(
    $$insert into public.integration_connections (user_id, provider_id, external_account_id, source_url, source_url_hash) values ('22222222-2222-4222-8222-222222222222', 'rss', repeat('b', 64), 'https://example.com/other.xml', repeat('b', 64))$$,
    '42501', null, 'RLS rejects a cross-user source insert'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
insert into public.integration_connections (
    user_id, provider_id, external_account_id, source_url, source_url_hash
) values (
    '22222222-2222-4222-8222-222222222222', 'rss', repeat('a', 64),
    'https://example.com/feed.xml', repeat('a', 64)
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select results_eq(
    $$select count(*)::bigint from public.integration_connections where provider_id = 'rss'$$,
    $$values (1::bigint)$$,
    'RSS source health is isolated by owner'
);

update public.integration_connections
set sync_status = 'disabled', disabled_at = now(), next_sync_at = null
where id = '10000000-0000-4000-8000-000000000001';

select results_eq(
    $$select count(*)::bigint from public.integration_connections where sync_status = 'disabled' and next_sync_at is null$$,
    $$values (1::bigint)$$,
    'disabling a source removes it from future scheduling'
);

reset role;
select * from finish();
rollback;
