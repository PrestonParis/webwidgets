-- Fix soft-delete: explicit WITH CHECK so setting deleted_at doesn't
-- conflict with the SELECT policy's "deleted_at IS NULL" visibility check.
DROP POLICY IF EXISTS "Users can update their own journals" ON public.journals;
CREATE POLICY "Users can update their own journals" ON public.journals
    FOR UPDATE
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
