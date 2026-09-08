import { z } from 'zod';
import {
    calendarActionPayloadSchema,
    calendarReceiptSchema,
} from '@/lib/calendarActions/contracts';
import { taskCandidatePayloadSchema } from '@/lib/commitments/schemas';
import { emailMessageSchema } from '@/lib/emailActions/contracts';
import { emailReceiptSchema } from '@/lib/emailActions/receipts';

export const taskCreateInputSchema = taskCandidatePayloadSchema.strict();

export const taskUpdateInputSchema = z
    .strictObject({
        taskId: z.uuid(),
        expectedUpdatedAt: z.iso.datetime({ offset: true }),
        title: z.string().trim().min(1).max(300).optional(),
        notes: z.string().trim().max(1_000).optional(),
        dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
    })
    .refine(
        ({ title, notes, dueAt }) =>
            title !== undefined || notes !== undefined || dueAt !== undefined,
        'A task update must change at least one field.',
    );

export const taskCompleteInputSchema = z.strictObject({
    taskId: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const taskReceiptSchema = z.strictObject({
    taskId: z.uuid(),
    title: z.string(),
    notes: z.string().nullable(),
    dueAt: z.iso.datetime({ offset: true }).nullable(),
    completed: z.boolean(),
    completedAt: z.iso.datetime({ offset: true }).nullable(),
    verifiedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const calendarCreateInputSchema = calendarActionPayloadSchema;
export const calendarCreateOutputSchema = calendarReceiptSchema.strict();
export const emailDraftInputSchema = emailMessageSchema;
export const emailDraftOutputSchema = emailReceiptSchema.strict();
