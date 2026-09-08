-- Fill schema gaps the application code already depends on but which were
-- never migrated. All changes are additive.
--
-- 1. custom_widgets — backing table for the Widget Builder feature
--    (apps/web/app/api/widget-builder/**). Nothing created it.
-- 2. recovery_profiles.name / .category — read by the recovery adapter and
--    resolver (features/recovery, features/import-export/adapters/recoveryAdapter).
-- 3. memory_cards.ease / .repetitions — SM-2 scheduling fields read/written by
--    the memory-cards API routes.

-- ── 1. custom_widgets ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'custom',
  icon text,
  tags text[] NOT NULL DEFAULT '{}',
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE custom_widgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_widgets' AND policyname = 'users own custom widgets'
  ) THEN
    CREATE POLICY "users own custom widgets" ON custom_widgets
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS custom_widgets_set_updated_at ON custom_widgets;
CREATE TRIGGER custom_widgets_set_updated_at
  BEFORE UPDATE ON custom_widgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS custom_widgets_user_id_idx ON custom_widgets (user_id);

-- ── 2. recovery_profiles gaps ───────────────────────────────────────────────

ALTER TABLE recovery_profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text;

-- ── 3. memory_cards SM-2 fields ─────────────────────────────────────────────

ALTER TABLE memory_cards
  ADD COLUMN IF NOT EXISTS ease numeric NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS repetitions integer NOT NULL DEFAULT 0;
