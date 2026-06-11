import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { listActivityEvents } from '@/features/activity/services/activityService';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const relatedEntitySchema = z.object({
    type: z.string(),
    id: z.string(),
    label: z.string().optional(),
    url: z.string().optional(),
});

const activityEventSchema = z.object({
    id: z.string(),
    userId: z.string(),
    source: z.string(),
    eventType: z.string().optional(),
    sourceId: z.string().optional(),
    sourceTable: z.string().optional(),
    severity: z.enum(['info', 'success', 'warning', 'critical']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    category: z.enum(['ai', 'content', 'data', 'automation', 'system']),
    title: z.string(),
    body: z.string().optional(),
    isArchived: z.boolean(),
    readAt: z.string().optional(),
    occurredAt: z.string(),
    createdAt: z.string(),
    relatedEntities: z.array(relatedEntitySchema),
    metadata: z.record(z.string(), z.unknown()),
    actionUrl: z.string().optional(),
});

const activitySnapshotSchema = z.object({
    events: z.array(activityEventSchema),
    unreadCount: z.number(),
    totalCount: z.number(),
});

export const activityResolvers: DataResolver[] = [
    {
        key: 'activity.recent',
        cachePolicy: { ttlSeconds: 30 },
        schema: activitySnapshotSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for activity resolver');
            const { supabase } = await createClients();
            const events = await listActivityEvents(supabase, ctx.userId, {
                limit: 10,
                archived: false,
            });
            const unreadCount = events.filter((e) => !e.readAt).length;
            return {
                events,
                unreadCount,
                totalCount: events.length,
            };
        },
    },
];
