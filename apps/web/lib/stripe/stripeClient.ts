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

export const stripe = new Stripe(stripeSecretKey, {
    typescript: true,
});

export const STRIPE_PRICE_IDS: Record<string, string> = {
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
};
