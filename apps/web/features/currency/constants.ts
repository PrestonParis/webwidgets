export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: '$',
    AUD: '$',
    CHF: '₣',
    CNY: '¥',
    INR: '₹',
    MXN: '$',
};

export const POPULAR_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'CNY',
    'INR',
    'MXN',
];

export const DISPLAY_TARGETS = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

// These are kept for any external consumers; the hook manages its own cache internally.
export const CACHE_KEY = 'currency_rates_v2';
export const CACHE_TTL = 30 * 60 * 1000; // 30 min
