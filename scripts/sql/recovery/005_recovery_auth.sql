-- 1. Enable RLS on all three tables
ALTER TABLE recovery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE urges ENABLE ROW LEVEL SECURITY;
ALTER TABLE relapses ENABLE ROW LEVEL SECURITY;

-- 2. Recovery profiles: users only see/touch their own
CREATE POLICY "users can select own profiles"
    ON recovery_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "users can insert own profiles"
    ON recovery_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own profiles"
    ON recovery_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "users can delete own profiles"
    ON recovery_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Urges: visible only if the linked tracker belongs to the user
CREATE POLICY "users can select own urges"
    ON urges FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = urges.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "users can insert own urges"
    ON urges FOR INSERT
    WITH CHECK (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = urges.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "users can delete own urges"
    ON urges FOR DELETE
    USING (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = urges.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

-- 4. Same pattern for relapses
CREATE POLICY "users can select own relapses"
    ON relapses FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = relapses.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "users can insert own relapses"
    ON relapses FOR INSERT
    WITH CHECK (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = relapses.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "users can delete own relapses"
    ON relapses FOR DELETE
    USING (
        EXISTS (
        SELECT 1 FROM recovery_profiles
        WHERE recovery_profiles.id = relapses.tracker_id
            AND recovery_profiles.user_id = auth.uid()
        )
    );

-- 5. Drop the broken unique constraint if you want multiple profiles per user
ALTER TABLE recovery_profiles
    DROP CONSTRAINT IF EXISTS recovery_profiles_user_id_key;