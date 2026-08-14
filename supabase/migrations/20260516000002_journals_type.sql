-- Distinguish journal entries from documents in the same table.
-- Default to 'journal' so existing rows remain unchanged.
ALTER TABLE public.journals
    ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'journal'
        CONSTRAINT journals_type_check CHECK (type IN ('journal', 'document'));
CREATE INDEX IF NOT EXISTS journals_user_type_idx
    ON public.journals (user_id, type, created_at DESC);
