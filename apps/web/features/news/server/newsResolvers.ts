import { z } from 'zod';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const rankedFeedSchema = z.array(z.unknown());

export const newsResolvers: DataResolver<unknown[]>[] = [
    {
        key: 'events.feed.ranked',
        cachePolicy: { ttlSeconds: 30 },
        schema: rankedFeedSchema,
        resolve() {
            return Promise.resolve([]);
        },
    },
];
