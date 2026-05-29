CREATE TABLE IF NOT EXISTS conversion_jobs (
  id uuid PRIMARY KEY,
  status text NOT NULL,
  kind text NOT NULL DEFAULT 'document',
  original_file_name text NOT NULL,
  source_mime text NOT NULL,
  source_extension text NOT NULL,
  target_extension text NOT NULL,
  file_size_bytes bigint NOT NULL,
  user_id text,
  input_object_key text NOT NULL,
  output_object_key text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
