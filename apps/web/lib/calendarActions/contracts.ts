import { z } from 'zod';

const title = z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((value) => !/[\r\n\u0000]/u.test(value));
const attendees = z.array(z.email().max(320)).max(20).default([]);
const common = {
    provider: z.literal('google'),
    accountId: z.uuid(),
    calendarId: z.literal('primary'),
    title,
    description: z.string().max(10_000).nullable(),
    location: z.string().max(1_000).nullable(),
    attendees,
};
const allDay = z
    .strictObject({
        ...common,
        allDay: z.literal(true),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
    })
    .refine(
        (value) => value.endDate > value.startDate,
        'End date must be after start date.',
    );
const timed = z
    .strictObject({
        ...common,
        allDay: z.literal(false),
        startsAt: z.iso.datetime({ offset: true }),
        endsAt: z.iso.datetime({ offset: true }),
        timezone: z
            .string()
            .min(1)
            .max(100)
            .refine((value) => {
                try {
                    Intl.DateTimeFormat('en', { timeZone: value });
                    return true;
                } catch {
                    return false;
                }
            }, 'Invalid IANA timezone.'),
    })
    .refine((value) => {
        const duration = Date.parse(value.endsAt) - Date.parse(value.startsAt);
        return duration > 0 && duration <= 366 * 86_400_000;
    }, 'Event duration must be positive and no longer than one year.');

export const calendarActionPayloadSchema = z.discriminatedUnion('allDay', [
    allDay,
    timed,
]);
export const calendarProposalSchema = z.strictObject({
    actionId: z.literal('calendar.create_event'),
    idempotencyKey: z.uuid(),
    event: calendarActionPayloadSchema,
});
export const calendarApprovalSchema = z.strictObject({
    actionRequestId: z.uuid(),
    actionId: z.literal('calendar.create_event'),
    payloadVersion: z.number().int().positive(),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/u),
    event: calendarActionPayloadSchema,
    decision: z.enum(['approved', 'denied']),
});
export const calendarReceiptSchema = z.object({
    state: z.enum(['verified', 'failed', 'unknown', 'cancelled']),
    providerObjectId: z.string().nullable(),
    htmlLink: z.url().nullable(),
    start: z.string().nullable(),
    end: z.string().nullable(),
    code: z.string(),
});
export type CalendarActionPayload = z.infer<typeof calendarActionPayloadSchema>;
export type CalendarActionReceipt = z.infer<typeof calendarReceiptSchema>;
