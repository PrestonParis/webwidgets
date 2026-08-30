-- The legacy column name says encrypted, but callers historically stored raw keys.
-- Treat every value as a credential and keep it behind server routes.

revoke all on table public.user_model_keys from public, anon, authenticated;
grant select (id, user_id, provider, created_at, updated_at)
    on table public.user_model_keys to authenticated;
grant all on table public.user_model_keys to service_role;
