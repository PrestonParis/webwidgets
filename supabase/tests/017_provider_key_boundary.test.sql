begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('d1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','keys@example.invalid');
update public.profiles set full_name='Key Owner',
    anthropic_api_key='private-anthropic-key'
where id='d1111111-1111-4111-8111-111111111111';
insert into public.user_integration_keys(user_id,provider,api_key)
values('d1111111-1111-4111-8111-111111111111','github','private-github-key');

set local role authenticated;
set local request.jwt.claim.sub='d1111111-1111-4111-8111-111111111111';
select is((select full_name from public.profiles where id=auth.uid()),
    'Key Owner','owner can still read safe profile metadata');
select is((select provider from public.user_integration_keys where user_id=auth.uid()),
    'github','owner can still read integration-key presence metadata');
select throws_ok($$select anthropic_api_key from public.profiles where id=auth.uid()$$,
    '42501',null,'browser role cannot read the email intelligence key');
select throws_ok($$select api_key from public.user_integration_keys where user_id=auth.uid()$$,
    '42501',null,'browser role cannot read integration keys');
select throws_ok($$update public.profiles set anthropic_api_key='stolen' where id=auth.uid()$$,
    '42501',null,'browser role cannot replace the email intelligence key directly');
select throws_ok($$insert into public.user_integration_keys(user_id,provider,api_key)
    values(auth.uid(),'linear','stolen')$$,
    '42501',null,'browser role cannot write integration keys directly');
reset role;

select ok(not has_column_privilege('authenticated','public.profiles',
    'anthropic_api_key','SELECT') and not has_column_privilege('authenticated',
    'public.profiles','anthropic_api_key','UPDATE'),
    'profile secret has no authenticated read or update privilege');
select ok(not has_column_privilege('authenticated','public.user_integration_keys',
    'api_key','SELECT') and not has_column_privilege('authenticated',
    'public.user_integration_keys','api_key','UPDATE'),
    'integration secret has no authenticated read or update privilege');

set local role service_role;
select is((select anthropic_api_key from public.profiles
    where id='d1111111-1111-4111-8111-111111111111'),
    'private-anthropic-key','service role retains the server credential path');
select is((select api_key from public.user_integration_keys
    where user_id='d1111111-1111-4111-8111-111111111111'),
    'private-github-key','service role retains integration credential access');
reset role;

select * from finish();
rollback;
