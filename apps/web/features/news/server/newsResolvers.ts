import { createClients } from '@/lib/supabase/serverClient';
import { timelineFeedResponseSchema } from '@/features/news/schemas/timelineFeedSchemas';
import { queryTimelineFeed } from '@/features/news/server/timelineFeedServer';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const newsResolvers: DataResolver[] = [
    {
        key: 'events.timeline',
        cachePolicy: { ttlSeconds: 60 },
        schema: timelineFeedResponseSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for timeline resolver');
            const { supabase } = await createClients();
            const result = await queryTimelineFeed(supabase, ctx.userId, {
                limit: 10,
                sourceTypes: [],
                eventTypes: [],
            });
            return timelineFeedResponseSchema.parse(result);
        },
    },
];
