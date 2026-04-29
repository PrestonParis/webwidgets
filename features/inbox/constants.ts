import { EmailCategory } from '@/types/inbox';

export const RULES: { pattern: RegExp; category: EmailCategory }[] = [
    {
        pattern: /github|jira|linear|gitlab|jenkins|vercel|sentry/i,
        category: 'work',
    },
    {
        pattern:
            /invoice|receipt|payment|bank|chase|paypal|stripe|venmo|statement|tax/i,
        category: 'finance',
    },
    {
        pattern: /amazon|ebay|etsy|order|shipped|delivery|tracking|ups|fedex/i,
        category: 'shopping',
    },
    {
        pattern: /unsubscribe|newsletter|digest|weekly|daily|roundup/i,
        category: 'promotions',
    },
    {
        pattern: /linkedin|twitter|facebook|instagram|tiktok|reddit/i,
        category: 'social',
    },
    {
        pattern:
            /alert|notification|noreply|no-reply|donotreply|verify|confirm/i,
        category: 'notifications',
    },
    {
        pattern: /offer|deal|discount|sale|% off|promo|coupon/i,
        category: 'promotions',
    },
];
