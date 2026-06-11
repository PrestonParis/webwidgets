CREATE TABLE IF NOT EXISTS conversion_batches (
  id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'pending',
  total_jobs integer NOT NULL,
  completed_jobs integer NOT NULL DEFAULT 0,
  failed_jobs integer NOT NULL DEFAULT 0,
  user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversion_jobs
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES conversion_batches(id);
