begin;
set local search_path=public,extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email) values
('b1111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','command-one@example.invalid'),
('b2222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','command-two@example.invalid');

insert into public.user_preferences(user_id,preferences) values
('b1111111-1111-4111-8111-111111111111','{"theme":"dark","commandCenter":{"density":"compact"}}');

set local role authenticated;
set local request.jwt.claim.sub='b1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.mark_command_center_seen()$$,'owner records a command-center visit');
select ok((select preferences#>>'{commandCenter,lastSeenAt}' is not null from public.user_preferences),'last-seen timestamp is persisted');
select is((select preferences->>'theme' from public.user_preferences),'dark','unrelated preferences are preserved');
select is((select preferences#>>'{commandCenter,density}' from public.user_preferences),'compact','existing command-center preferences are preserved');
reset role;

insert into public.user_preferences(user_id,preferences) values
('b2222222-2222-4222-8222-222222222222','{"theme":"light"}');
set local role authenticated;
set local request.jwt.claim.sub='b2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.user_preferences),1::bigint,'another user can read only their own preference row');
select lives_ok($$select public.mark_command_center_seen()$$,'another user records an isolated visit');
select ok((select preferences#>>'{commandCenter,lastSeenAt}' is not null from public.user_preferences),'last-seen is added when nested state did not exist');
select is((select preferences->>'theme' from public.user_preferences),'light','top-level preferences remain intact when nested state is added');
reset role;

select is((select count(*) from public.user_preferences),2::bigint,'each user has one isolated preference row');

select * from finish();
rollback;
