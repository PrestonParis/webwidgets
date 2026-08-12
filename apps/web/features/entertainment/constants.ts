export const ENTERTAINMENT_WIDGET_TYPES = [
    'chess',
    'memorization',
    'news',
    'reading',
    'creative',
] as const;

export type EntertainmentWidgetType = (typeof ENTERTAINMENT_WIDGET_TYPES)[number];

export const ENTERTAINMENT_ROUTES = [
    '/chess',
    '/memorization',
    '/news',
    '/reading',
] as const;

export const ENTERTAINMENT_FLAG_KEY = 'entertainment_beta';

export function isEntertainmentWidgetType(
    type: string,
): type is EntertainmentWidgetType {
    return (ENTERTAINMENT_WIDGET_TYPES as readonly string[]).includes(type);
}
