begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('e1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','model-key@example.invalid');
insert into public.user_model_keys(user_id,provider,api_key_encrypted)
values('e1111111-1111-4111-8111-111111111111','anthropic','historically-raw-key');

set local role authenticated;
set local request.jwt.claim.sub='e1111111-1111-4111-8111-111111111111';
select is((select provider from public.user_model_keys where user_id=auth.uid()),
    'anthropic','browser role can read key-presence metadata');
select throws_ok($$select api_key_encrypted from public.user_model_keys
    where user_id=auth.uid()$$,'42501',null,
    'browser role cannot read legacy model credential values');
select throws_ok($$insert into public.user_model_keys(user_id,provider,api_key_encrypted)
    values(auth.uid(),'openai','browser-write')$$,'42501',null,
    'browser role cannot write model credentials directly');
reset role;

select ok(not has_column_privilege('authenticated','public.user_model_keys',
    'api_key_encrypted','SELECT') and not has_column_privilege('authenticated',
    'public.user_model_keys','api_key_encrypted','UPDATE'),
    'legacy model credential column has no authenticated read or update privilege');

set local role service_role;
select is((select api_key_encrypted from public.user_model_keys
    where user_id='e1111111-1111-4111-8111-111111111111'),
    'historically-raw-key','service route retains model credential access');
reset role;

select * from finish();
rollback;
