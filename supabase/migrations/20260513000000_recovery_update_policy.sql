-- Allow users to update their own recovery profiles (needed for resetting start_time on relapse)
DROP POLICY IF EXISTS "users can update own profiles" ON public.recovery_profiles;
CREATE POLICY "users can update own profiles"
    ON public.recovery_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
