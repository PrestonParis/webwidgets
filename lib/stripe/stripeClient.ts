import Stripe from 'stripe';

// Server-only — never import this in client components.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    typescript: true,
});

export const STRIPE_PRICE_IDS: Record<string, string> = {
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
};
