import { z } from 'zod';

export const taskCandidatePayloadSchema = z.object({
    title: z.string().trim().min(1).max(300),
    notes: z.string().trim().max(1_000).default(''),
    dueAt: z.iso.datetime().nullable().default(null),
    sourceReference: z.string().max(2_000).nullable().default(null),
});

export const calendarCandidatePayloadSchema = z
    .object({
        title: z.string().trim().min(1).max(300),
        notes: z.string().trim().max(1_000).default(''),
        startsAt: z.iso.datetime(),
        endsAt: z.iso.datetime(),
        allDay: z.boolean().default(false),
        timeZone: z.string().min(1).max(100),
        sourceReference: z.string().max(2_000).nullable().default(null),
    })
    .refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), {
        message: 'End must follow start',
        path: ['endsAt'],
    });

export const candidatePayloadSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('task'), payload: taskCandidatePayloadSchema }),
    z.object({
        kind: z.literal('calendar'),
        payload: calendarCandidatePayloadSchema,
    }),
]);

export const candidateReviewSchema = z.discriminatedUnion('decision', [
    z.object({
        decision: z.literal('edit'),
        expectedVersion: z.number().int().positive(),
        kind: z.enum(['task', 'calendar']),
        payload: z.unknown(),
    }),
    z.object({
        decision: z.enum(['approve', 'dismiss', 'incorrect']),
        expectedVersion: z.number().int().positive(),
        expectedHash: z.string().min(16).max(200),
    }),
]);

export const generateCandidatesSchema = z.object({
    lookbackDays: z.number().int().min(1).max(30).default(14),
});
