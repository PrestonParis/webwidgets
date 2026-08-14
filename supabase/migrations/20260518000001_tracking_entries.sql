CREATE TABLE tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  entry_date DATE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tracking_user_cat_date ON tracking_entries(user_id, category, entry_date DESC);
ALTER TABLE tracking_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries" ON tracking_entries FOR ALL USING (auth.uid() = user_id);
