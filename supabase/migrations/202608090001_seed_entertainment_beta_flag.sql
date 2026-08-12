-- Entertainment (chess, memorization, news, reading, creative) is going into
-- beta: admins can still use it, everyone else needs this flag enabled.
-- Idempotent: safe to re-run, does nothing if the key already exists.
insert into feature_flags (key, description, enabled, rollout_pct)
select
    'entertainment_beta',
    'Gates the Entertainment category (chess, memorization, news, reading, creative) to admins only while in beta.',
    false,
    0
where not exists (
    select 1 from feature_flags where key = 'entertainment_beta'
);
