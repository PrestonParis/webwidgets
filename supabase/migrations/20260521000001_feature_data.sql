-- MEMORIZATION

CREATE TABLE IF NOT EXISTS memory_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  domain text NOT NULL DEFAULT 'General',
  description text,
  source text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE memory_decks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memory_decks' AND policyname = 'users own decks') THEN
    CREATE POLICY "users own decks" ON memory_decks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS memory_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck_id uuid REFERENCES memory_decks(id) ON DELETE CASCADE NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  interval_days integer NOT NULL DEFAULT 1,
  due_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE memory_cards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memory_cards' AND policyname = 'users own cards') THEN
    CREATE POLICY "users own cards" ON memory_cards FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS memory_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  domain text NOT NULL DEFAULT 'General',
  minutes integer NOT NULL DEFAULT 10,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE memory_routines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memory_routines' AND policyname = 'users own routines') THEN
    CREATE POLICY "users own routines" ON memory_routines FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- COMMAND CENTER

CREATE TABLE IF NOT EXISTS command_workstreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  domain text NOT NULL DEFAULT 'General',
  owner text,
  status text NOT NULL DEFAULT 'queued',
  priority text NOT NULL DEFAULT 'medium',
  progress integer NOT NULL DEFAULT 0,
  next_step text,
  due text,
  blockers integer NOT NULL DEFAULT 0,
  automations integer NOT NULL DEFAULT 0,
  confidence integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE command_workstreams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'command_workstreams' AND policyname = 'users own workstreams') THEN
    CREATE POLICY "users own workstreams" ON command_workstreams FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- COLLABORATION

CREATE TABLE IF NOT EXISTS collaboration_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'General',
  description text,
  status text NOT NULL DEFAULT 'live',
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE collaboration_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_workspaces' AND policyname = 'users own collab workspaces') THEN
    CREATE POLICY "users own collab workspaces" ON collaboration_workspaces FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS collaboration_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE SET NULL,
  title text NOT NULL,
  owner text,
  scope text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'medium',
  due text,
  complete boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE collaboration_handoffs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_handoffs' AND policyname = 'users own handoffs') THEN
    CREATE POLICY "users own handoffs" ON collaboration_handoffs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- CREATIVE

CREATE TABLE IF NOT EXISTS creative_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  format text NOT NULL DEFAULT '1440 x 960',
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE creative_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creative_projects' AND policyname = 'users own projects') THEN
    CREATE POLICY "users own projects" ON creative_projects FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS creative_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES creative_projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  layer_type text NOT NULL DEFAULT 'shape',
  visible boolean NOT NULL DEFAULT true,
  locked boolean NOT NULL DEFAULT false,
  x float NOT NULL DEFAULT 0,
  y float NOT NULL DEFAULT 0,
  width float NOT NULL DEFAULT 200,
  height float NOT NULL DEFAULT 100,
  color text DEFAULT '#e5e7eb',
  layer_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE creative_layers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creative_layers' AND policyname = 'users own layers') THEN
    CREATE POLICY "users own layers" ON creative_layers FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- ACCESSIBILITY

CREATE TABLE IF NOT EXISTS accessibility_settings (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  high_contrast boolean NOT NULL DEFAULT false,
  reduce_motion boolean NOT NULL DEFAULT false,
  persistent_focus boolean NOT NULL DEFAULT true,
  density integer NOT NULL DEFAULT 50,
  transcription_first boolean NOT NULL DEFAULT false,
  reader_comfort boolean NOT NULL DEFAULT false,
  keyboard_mode boolean NOT NULL DEFAULT false,
  low_cognitive_load boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accessibility_settings' AND policyname = 'users own a11y settings') THEN
    CREATE POLICY "users own a11y settings" ON accessibility_settings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
