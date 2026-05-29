import { z } from 'zod';

export const normalizedMessageSchema = z.object({
    id: z.string(),
    provider: z.enum(['gmail', 'outlook', 'slack', 'discord']),
    subject: z.string(),
    from: z.string(),
    snippet: z.string(),
    date: z.string(),
    isRead: z.boolean(),
    threadId: z.string().optional(),
    actionCount: z.number().default(0),
});

export const inboxSummarySchema = z.object({
    messages: z.array(normalizedMessageSchema),
    unreadCount: z.number(),
    connectedProviders: z.array(z.string()),
});

export type NormalizedMessage = z.infer<typeof normalizedMessageSchema>;
export type InboxSummary = z.infer<typeof inboxSummarySchema>;
