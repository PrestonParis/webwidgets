import { z } from 'zod';

export const providerCallResultSchema = z.object({
    providerId: z.string(),
    operation: z.string(),
    status: z.enum(['ok', 'failed']),
    durationMs: z.number(),
    data: z.unknown().optional(),
});

export const extractedContentSchema = z.object({
    title: z.string(),
    url: z.string().url().optional(),
    markdown: z.string(),
    text: z.string(),
    extractedAt: z.date(),
    providerId: z.string(),
});

export type ProviderCallResult = z.infer<typeof providerCallResultSchema>;
export type ExtractedContent = z.infer<typeof extractedContentSchema>;
