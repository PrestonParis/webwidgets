-- Soft-delete and restore RPCs with SECURITY DEFINER so they run as
-- the owning role and bypass the SELECT-policy visibility check that
-- blocks a direct UPDATE when deleted_at transitions to non-NULL.
-- auth.uid() is evaluated at call time so users can only touch their own rows.

CREATE OR REPLACE FUNCTION public.soft_delete_journal(p_entry_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.journals
  SET    deleted_at = now()
  WHERE  id      = p_entry_id
    AND  user_id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.restore_journal(p_entry_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.journals
  SET    deleted_at = null
  WHERE  id      = p_entry_id
    AND  user_id = auth.uid();
$$;
