import { z } from 'zod';

export const normalizedEventSchema = z.object({
    id: z.string(),
    provider: z.enum(['google', 'outlook', 'teams']),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    location: z.string().optional(),
    description: z.string().optional(),
    htmlLink: z.string().optional(),
    status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
});

export const calendarSnapshotSchema = z.object({
    events: z.array(normalizedEventSchema),
    connectedProviders: z.array(z.string()),
    windowDays: z.number(),
});

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;
export type CalendarSnapshot = z.infer<typeof calendarSnapshotSchema>;
