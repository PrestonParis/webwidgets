import superjson from 'superjson';
import { z } from 'zod';
import {
    rankedFeedItemSchema,
    timelineEventSchema,
} from '@/features/news/schemas/eventSchemas';
import type { NewsFeedResponse } from '@/features/news/types/news';

const responseSchema = z.object({
    items: z.array(rankedFeedItemSchema),
    timelines: z.array(timelineEventSchema),
    generatedAt: z.string().datetime(),
    sourceCount: z.number().int().min(0),
});

export async function fetchNewsFeed(): Promise<NewsFeedResponse> {
    const response = await fetch('/api/news/feed');
    if (!response.ok) throw new Error('Failed to load news feed');
    const wirePayload = await response.json();
    return responseSchema.parse(superjson.deserialize(wirePayload));
}
