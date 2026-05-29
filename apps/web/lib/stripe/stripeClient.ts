import Stripe from 'stripe';

// Server-only — never import this in client components.
const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    '';

export function hasStripeConfig() {
    return Boolean(stripeSecretKey);
}

export function getStripeWebhookSecret() {
    return (
        process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
        process.env.STRIPE_ENDPOINT_SECRET?.trim() ||
        ''
    );
}

// Only instantiate when the key is present — avoids throwing at module load
// time during builds where STRIPE_SECRET_KEY is not set.
export const stripe = (
    stripeSecretKey ? new Stripe(stripeSecretKey, { typescript: true }) : null
) as Stripe;

export const STRIPE_PRICE_IDS: Record<string, string> = {
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
};
