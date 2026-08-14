CREATE TABLE tracking_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'daily_min' | 'weekly_count' | 'daily_log'
  metric_key TEXT,           -- e.g. 'durationHours' for daily_min goals
  target_value NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);
ALTER TABLE tracking_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON tracking_goals FOR ALL USING (auth.uid() = user_id);
