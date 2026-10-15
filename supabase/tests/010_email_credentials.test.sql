begin;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, instance_id, aud, role, email) values
    ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'credential-one@example.invalid'),
    ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'credential-two@example.invalid');

select ok(not has_table_privilege('authenticated', 'public.user_tokens', 'SELECT'), 'no whole-table token SELECT');
select ok(not has_column_privilege('authenticated', 'public.user_tokens', 'refresh_token', 'SELECT'), 'legacy refresh secret hidden');
select ok(not has_column_privilege('authenticated', 'public.user_tokens', 'microsoft_access_token', 'SELECT'), 'Microsoft secret hidden');
select ok(not has_column_privilege('authenticated', 'public.user_email_accounts', 'access_token', 'SELECT'), 'account access secret hidden');
select ok(not has_column_privilege('anon', 'public.user_email_accounts', 'email', 'SELECT'), 'anonymous metadata denied');
select ok(not has_table_privilege('authenticated', 'public.user_email_accounts', 'UPDATE'), 'browser credential update denied');
select ok(not has_function_privilege('authenticated', 'public.store_verified_provider_credentials(uuid,text,text,text,text[],text,text,bigint)', 'EXECUTE'), 'browser cannot persist credentials');
select ok(not has_function_privilege('authenticated', 'public.consume_oauth_connection_attempt(text,uuid,text)', 'EXECUTE'), 'browser cannot consume OAuth attempts');

set local role service_role;
select public.store_verified_provider_credentials('11111111-1111-4111-8111-111111111111', 'google', 'google@example.invalid', 'google-subject', array['gmail.readonly'], 'fixture-google', 'fixture-google-refresh', 2000000000000);
select public.store_verified_provider_credentials('11111111-1111-4111-8111-111111111111', 'microsoft', 'outlook@example.invalid', 'microsoft-subject', array['Mail.Read'], 'fixture-microsoft', 'fixture-microsoft-refresh', 2000000000000);
select public.store_verified_provider_credentials('22222222-2222-4222-8222-222222222222', 'google', 'other@example.invalid', 'other-subject', array['gmail.readonly'], 'fixture-other', null, 2000000000000);
select is((select access_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), 'fixture-google', 'Microsoft does not overwrite Google');
select is((select scopes from public.integration_connections where external_account_id = 'google@example.invalid'), array['gmail.readonly'], 'scope is actual grant, not legacy calendar assumption');
select public.store_verified_provider_credentials('11111111-1111-4111-8111-111111111111', 'google', 'google@example.invalid', 'google-subject', array['gmail.readonly'], 'fixture-google-2', null, 2000000000000);
select is((select refresh_token from public.user_email_accounts where email = 'google@example.invalid'), 'fixture-google-refresh', 'same-account reconnect preserves omitted refresh token');
select throws_ok($$select public.store_verified_provider_credentials('11111111-1111-4111-8111-111111111111', 'google', 'google@example.invalid', 'wrong-subject', array['gmail.readonly'], 'fixture-wrong', null, 2000000000000)$$, 'P0001', 'provider_account_identity_changed', 'identity change fails closed');
select public.store_verified_provider_credentials('11111111-1111-4111-8111-111111111111', 'google', 'second@example.invalid', 'second-subject', array['gmail.readonly'], 'fixture-second', null, 2000000000000);
select is((select refresh_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), null::text, 'switching account never pairs another account refresh token');
update public.integration_connections set state = 'disabled', disabled_at = now() where external_account_id = 'second@example.invalid';
update public.user_email_accounts set access_token = 'fixture-rotated', refresh_token = 'fixture-rotated-refresh' where email = 'second@example.invalid';
select is((select state::text from public.integration_connections where external_account_id = 'second@example.invalid'), 'disabled', 'refresh does not reactivate disabled connection');

insert into public.oauth_connection_attempts (state_hash, user_id, provider, redirect_path, code_verifier) values
    ('fixture-state', '11111111-1111-4111-8111-111111111111', 'microsoft', '/inbox', 'fixture-verifier');
select is((select count(*) from public.consume_oauth_connection_attempt('fixture-state', '22222222-2222-4222-8222-222222222222', 'microsoft')), 0::bigint, 'state rejects wrong owner');
select is((select count(*) from public.consume_oauth_connection_attempt('fixture-state', '11111111-1111-4111-8111-111111111111', 'google')), 0::bigint, 'state rejects wrong provider');
select is((select count(*) from public.consume_oauth_connection_attempt('fixture-state', '11111111-1111-4111-8111-111111111111', 'microsoft')), 1::bigint, 'state accepted once');
select is((select count(*) from public.consume_oauth_connection_attempt('fixture-state', '11111111-1111-4111-8111-111111111111', 'microsoft')), 0::bigint, 'state replay rejected');
insert into public.oauth_connection_attempts (state_hash, user_id, provider, redirect_path, expires_at) values
    ('expired-state', '11111111-1111-4111-8111-111111111111', 'google', '/inbox', now() - interval '1 minute');
select is((select count(*) from public.consume_oauth_connection_attempt('expired-state', '11111111-1111-4111-8111-111111111111', 'google')), 0::bigint, 'expired state rejected');

reset role;
select set_config('test.other_connection', (select id::text from public.integration_connections where external_account_id = 'other@example.invalid'), true);
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select is((select count(id) from public.user_email_accounts), 3::bigint, 'owner sees metadata only for own accounts');
select is((select count(user_id) from public.user_tokens), 1::bigint, 'owner sees own connection flags');
select throws_ok($$select access_token from public.user_email_accounts$$, '42501', null, 'SQL secret read denied');
select throws_ok($$select * from public.user_tokens$$, '42501', null, 'SQL legacy wildcard denied');
select throws_ok($$update public.user_email_accounts set access_token = 'injected'$$, '42501', null, 'SQL credential mutation denied');
select throws_ok($$select * from public.oauth_connection_attempts$$, '42501', null, 'SQL verifier read denied');
select is(public.disconnect_provider_connection(current_setting('test.other_connection')::uuid), false, 'cross-owner disconnect rejected');
select is(public.disconnect_provider_connection((select id from public.integration_connections where external_account_id = 'google@example.invalid')), true, 'owner disconnect works');
reset role;
select is((select access_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), 'fixture-second', 'disconnect old account preserves newer mirror');
set local role authenticated;
select is(public.disconnect_provider_connection((select id from public.integration_connections where external_account_id = 'second@example.invalid')), true, 'disconnect mirrored account works');
reset role;
select is((select access_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), '', 'disconnect clears mirrored Google secret');
select is((select microsoft_access_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), 'fixture-microsoft', 'disconnect preserves other provider');
set local role authenticated;
select is(public.disconnect_provider_connection((select id from public.integration_connections where external_account_id = 'outlook@example.invalid')), true, 'Microsoft disconnect works');
reset role;
select is((select microsoft_refresh_token from public.user_tokens where user_id = '11111111-1111-4111-8111-111111111111'), null::text, 'Microsoft disconnect clears legacy refresh secret');
select is((select count(*) from public.user_email_accounts where user_id = '22222222-2222-4222-8222-222222222222'), 1::bigint, 'other owner credentials unaffected');
select * from finish();
rollback;
