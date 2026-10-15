-- Track whether an extracted email action has been confirmed by the user and synced to widgets
ALTER TABLE public.email_actions ADD COLUMN IF NOT EXISTS synced boolean NOT NULL DEFAULT false;
