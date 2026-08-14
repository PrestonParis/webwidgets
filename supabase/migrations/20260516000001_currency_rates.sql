-- Currency rates cache: server fetches and stores here so all clients
-- share one upstream request instead of each browser hitting the provider.
CREATE TABLE IF NOT EXISTS public.currency_rates (
    base        text        PRIMARY KEY,
    date        text        NOT NULL,
    rates       jsonb       NOT NULL,
    fetched_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
-- Rates are not user-sensitive — allow public reads so the anon client can
-- query them from the API route without the service-role key.
CREATE POLICY "currency_rates_public_read"
    ON public.currency_rates
    FOR SELECT
    TO anon, authenticated
    USING (true);
-- Inserts and updates are performed only from server-side API routes using
-- the service-role key, so no additional write policies are needed.;
