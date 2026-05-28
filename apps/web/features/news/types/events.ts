import type { z } from 'zod';
import type {
    actionableEventSchema,
    enrichedFeedItemSchema,
    feedEventSchema,
    newsEventSchema,
    rankedFeedItemSchema,
    rawSourceEventSchema,
    timelineEventSchema,
} from '../schemas/eventCoreSchemas';

export type RawSourceEvent = z.infer<typeof rawSourceEventSchema>;
export type NewsEvent = z.infer<typeof newsEventSchema>;
export type FeedEvent = z.infer<typeof feedEventSchema>;
export type EnrichedFeedItem = z.infer<typeof enrichedFeedItemSchema>;
export type RankedFeedItem = z.infer<typeof rankedFeedItemSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type ActionableEvent = z.infer<typeof actionableEventSchema>;
