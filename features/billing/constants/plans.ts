import type { BillingPlan } from '@/features/billing/types/billing';

export const BILLING_PLANS: BillingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        description: 'Build your personalized productivity workspace.',
        cta: 'Get Started Free',
        features: [
            'Core widgets',
            'Drag-and-drop layout',
            'Guided onboarding',
            'Gmail integration',
            'Google Calendar integration',
            '5 file uploads (10 MB each)',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 9,
        description: 'Advanced automation and integrations for power users.',
        cta: 'Upgrade to Pro',
        highlighted: true,
        badge: 'Most Popular',
        stripePriceEnvKey: 'STRIPE_PRICE_PRO_MONTHLY',
        features: [
            'Everything in Free',
            '5 GB storage',
            'Unlimited uploads',
            'AI email classification',
            'GitHub integration (Beta)',
            'All future integrations',
            'Priority releases',
        ],
    },
    {
        id: 'business',
        name: 'Business',
        priceMonthly: 29,
        description: 'Built for serious workflows and growing teams.',
        cta: 'Upgrade to Business',
        stripePriceEnvKey: 'STRIPE_PRICE_BUSINESS_MONTHLY',
        features: [
            'Everything in Pro',
            '50 GB storage',
            'Team sharing (Coming Soon)',
            'Custom integrations (Coming Soon)',
            'Priority email support',
            'Early access to new features',
        ],
    },
];

export function getPlan(planId: string): BillingPlan {
    return BILLING_PLANS.find((p) => p.id === planId) ?? BILLING_PLANS[0]!;
}
