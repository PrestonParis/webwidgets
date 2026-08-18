import { z } from 'zod';

export const rssSourceInputSchema = z.object({
    url: z.string().trim().url().max(2_048),
    fetchIntervalMinutes: z.number().int().min(15).max(1_440).default(30),
});

export const rssSourceSchema = z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    status: z.enum([
        'idle',
        'scheduled',
        'syncing',
        'healthy',
        'degraded',
        'disabled',
        'disconnected',
    ]),
    lastSuccessAt: z.string().datetime().nullable(),
    nextAttemptAt: z.string().datetime().nullable(),
    failureCount: z.number().int().min(0),
    errorCode: z.string().nullable(),
    fetchIntervalMinutes: z.number().int(),
});

export type RssSource = z.infer<typeof rssSourceSchema>;
