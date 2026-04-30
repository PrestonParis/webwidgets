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

export const CACHE_KEY = 'currency_rates_v1';
export const CACHE_TTL = 86_400_000; // 24 hours
