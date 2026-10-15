-- Raw provider credentials are server-only. Browsers receive metadata only.

revoke all on table public.user_integration_keys from public, anon, authenticated;
grant select (id, user_id, provider, label, created_at, updated_at)
    on table public.user_integration_keys to authenticated;
grant all on table public.user_integration_keys to service_role;

revoke all on table public.profiles from public, anon, authenticated;
grant select (id, full_name, role, use_ai_email, created_at, updated_at)
    on table public.profiles to authenticated;
grant insert (id, full_name, use_ai_email)
    on table public.profiles to authenticated;
grant update (full_name, use_ai_email)
    on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
