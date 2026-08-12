-- One-time backfill for the Entertainment beta gate: permanently removes
-- chess/memorization/news/reading/creative widget entries from the saved
-- dashboard layout of every non-admin user. Admins/owner keep their layout
-- untouched. This is destructive (positions/config are not recoverable once
-- run) — review before applying to production.
--
-- Mirrors the admin check in apps/web/features/admin/lib/adminPermissions.ts
-- (resolveAdminRole) and apps/web/features/admin/hooks/useIsAdmin.ts
-- (owner-email fallback).
update dashboard_layouts dl
set
    layout = (
        select coalesce(jsonb_agg(elem), '[]'::jsonb)
        from jsonb_array_elements(dl.layout) elem
        where elem->>'type' not in
            ('chess', 'memorization', 'news', 'reading', 'creative')
    ),
    updated_at = now()
where
    not exists (
        select 1 from profiles p
        where p.id = dl.user_id and p.role in ('owner', 'admin')
    )
    and not exists (
        select 1 from auth.users u
        where u.id = dl.user_id and u.email = 'prestonparis2005@gmail.com'
    )
    and exists (
        select 1 from jsonb_array_elements(dl.layout) elem
        where elem->>'type' in
            ('chess', 'memorization', 'news', 'reading', 'creative')
    );
