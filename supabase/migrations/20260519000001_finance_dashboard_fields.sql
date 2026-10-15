ALTER TABLE finance_accounts
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recurring_candidate BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE finance_transactions
SET title = COALESCE(title, merchant, category)
WHERE title IS NULL;
ALTER TABLE finance_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Subscriptions',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
UPDATE finance_subscriptions
SET
  billing_cycle = COALESCE(billing_cycle, CASE WHEN cadence = 'annual' THEN 'yearly' ELSE cadence END),
  next_billing_date = COALESCE(next_billing_date, next_charge_on)
WHERE billing_cycle IS NULL OR next_billing_date IS NULL;
