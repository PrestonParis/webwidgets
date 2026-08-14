-- Add 'note' to the journals type constraint.
ALTER TABLE public.journals
    DROP CONSTRAINT IF EXISTS journals_type_check;
ALTER TABLE public.journals
    ADD CONSTRAINT journals_type_check
        CHECK (type IN ('journal', 'document', 'note'));
