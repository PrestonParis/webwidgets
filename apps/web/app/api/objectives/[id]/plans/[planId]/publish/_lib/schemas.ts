import { z } from 'zod';

export const publishPlanBodySchema = z
    .object({
        contractVersion: z.literal('2.0'),
        expectedGraphHash: z.string().min(16).max(200),
    })
    .strict();

export const publishPlanResultSchema = z
    .object({
        planId: z.string().uuid(),
        status: z.literal('published'),
        publishedAt: z.string().datetime({ offset: true }),
        reused: z.boolean(),
    })
    .strict();

export class PlanPublicationError extends Error {
    constructor(
        readonly code: string,
        readonly status: number,
    ) {
        super(code);
        this.name = 'PlanPublicationError';
    }
}
