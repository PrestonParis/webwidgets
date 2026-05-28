import { z } from 'zod';

export const eventSourceSchema = z.enum([
    'rss',
    'news-api',
    'email',
    'calendar',
    'finance',
    'github',
    'research',
    'recovery',
    'notification',
    'ai-insight',
    'widget-action',
    'automation',
    'internal',
]);

export const eventCategorySchema = z.enum([
    'world',
    'business',
    'technology',
    'markets',
    'research',
    'personal',
    'system',
    'health',
    'productivity',
]);

export type EventSource = z.infer<typeof eventSourceSchema>;
export type EventCategory = z.infer<typeof eventCategorySchema>;
