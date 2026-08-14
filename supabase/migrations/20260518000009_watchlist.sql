CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'stock' | 'crypto' | 'real_estate' | 'custom'
  symbol TEXT NOT NULL,
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset_type, symbol)
);
CREATE TABLE watchlist_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES watchlist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_watchlist_readings_item ON watchlist_readings(item_id, fetched_at DESC);
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items" ON watchlist_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own readings" ON watchlist_readings FOR ALL USING (auth.uid() = user_id);
