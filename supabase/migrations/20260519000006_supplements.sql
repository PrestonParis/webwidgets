CREATE TABLE supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('by_time', 'after_time', 'window')),
    schedule_start TEXT NOT NULL, -- HH:MM 24-hour
    schedule_end TEXT,            -- HH:MM 24-hour, only for window type
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_supplements" ON supplements FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_supplements_user_active ON supplements(user_id, active);
