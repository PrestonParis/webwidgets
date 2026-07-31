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
    // User-facing news categories
    'politics',
    'government',
    'courts',
    'elections',
    'economy',
    'markets',
    'technology',
    'ai',
    'world',
    'war',
    'culture',
    'religion',
    'local',
    // Legacy / internal event categories
    'business',
    'research',
    'health',
    'personal',
    'system',
    'productivity',
]);

export type EventSource = z.infer<typeof eventSourceSchema>;
export type EventCategory = z.infer<typeof eventCategorySchema>;
