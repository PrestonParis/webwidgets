import { EmailCategory } from '@/features/inbox/types/inbox';

export const RULES: { pattern: RegExp; category: EmailCategory }[] = [
    // Work / dev tools
    {
        pattern:
            /github|jira|linear|gitlab|jenkins|vercel|sentry|bitbucket|confluence|trello|asana|notion|monday\.com|basecamp|figma|datadog|pagerduty/i,
        category: 'work',
    },
    // Work comms / video
    {
        pattern:
            /zoom|google meet|teams|webex|slack|microsoft 365|office 365|docusign|docuSign|esign|nda|contract|proposal|onboarding|hr |human resources/i,
        category: 'work',
    },
    // Finance / banking
    {
        pattern:
            /invoice|receipt|payment|bank|chase|wells fargo|bank of america|citi|paypal|stripe|venmo|zelle|cashapp|square|quickbooks|statement|tax|irs|w-2|1099|wire transfer|direct deposit|balance due|overdue/i,
        category: 'finance',
    },
    // Crypto / investing
    {
        pattern:
            /coinbase|binance|kraken|robinhood|fidelity|vanguard|schwab|etrade|portfolio|dividend|401k|ira |brokerage|stock alert|price alert|crypto/i,
        category: 'finance',
    },
    // Shopping / delivery
    {
        pattern:
            /amazon|ebay|etsy|shopify|walmart|target|best buy|newegg|wayfair|order confirmed|order shipped|delivery|tracking|ups|fedex|usps|dhl|package|out for delivery|delivered/i,
        category: 'shopping',
    },
    // Promotions / deals
    {
        pattern:
            /% off|sale ends|deal of the day|flash sale|limited time|promo code|coupon|discount|offer expires|black friday|cyber monday|clearance|free shipping|buy one get|exclusive offer/i,
        category: 'promotions',
    },
    // Newsletters / digests
    {
        pattern:
            /unsubscribe|newsletter|digest|weekly roundup|daily brief|morning briefing|recap|edition|issue #|vol\.|substack/i,
        category: 'promotions',
    },
    // Social networks
    {
        pattern:
            /linkedin|twitter|facebook|instagram|tiktok|reddit|snapchat|pinterest|youtube|twitch|discord|whatsapp|telegram|signal|bereal/i,
        category: 'social',
    },
    // Dating / social apps
    {
        pattern: /tinder|bumble|hinge|match\.com|okcupid|meetup|eventbrite/i,
        category: 'social',
    },
    // Automated notifications / security
    {
        pattern:
            /noreply|no-reply|donotreply|do-not-reply|verify your|confirm your|two.factor|2fa|security code|login attempt|sign.in from|new device|password reset|password changed|account locked|suspicious activity/i,
        category: 'notifications',
    },
    // System / service alerts
    {
        pattern:
            /alert|notification|reminder|your subscription|plan renewal|auto.renew|service update|terms of service|privacy policy|system maintenance|scheduled downtime/i,
        category: 'notifications',
    },
    // Healthcare
    {
        pattern:
            /appointment reminder|doctor|physician|clinic|hospital|pharmacy|prescription|refill|lab results|health insurance|medical|dental|vision plan|mychart|patient portal/i,
        category: 'personal',
    },
    // Education
    {
        pattern:
            /coursera|udemy|edx|khan academy|canvas|blackboard|d2l|brightspace|your course|assignment due|grade posted|tuition|financial aid|student loan/i,
        category: 'personal',
    },
    // Travel
    {
        pattern:
            /booking\.com|airbnb|expedia|hotels\.com|tripadvisor|united airlines|delta|southwest|american airlines|flight confirmation|itinerary|check.in|boarding pass|reservation/i,
        category: 'personal',
    },
];
