-- Stripe customer mapping: one row per user who has ever started a checkout.
CREATE TABLE billing_customers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id  TEXT        NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own customer" ON billing_customers FOR SELECT USING (auth.uid() = user_id);
-- Active subscriptions mirrored from Stripe via webhook.
CREATE TABLE billing_subscriptions (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id   TEXT        NOT NULL UNIQUE,
    stripe_customer_id       TEXT        NOT NULL,
    plan_id                  TEXT        NOT NULL DEFAULT 'free',
    status                   TEXT        NOT NULL DEFAULT 'active',
    current_period_start     TIMESTAMPTZ,
    current_period_end       TIMESTAMPTZ,
    cancel_at_period_end     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_billing_subscriptions_user ON billing_subscriptions(user_id);
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON billing_subscriptions FOR SELECT USING (auth.uid() = user_id);
