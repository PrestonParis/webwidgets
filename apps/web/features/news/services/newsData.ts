import type { RankedFeedItem } from '@/features/news/types/events';
import { groupTimelineEvents } from '@/features/news/services/timeline';
import { getDevOnlyNewsItems } from '@/features/news/fixtures/devOnlyNewsFeed';

export function getDemoNewsFeed() {
    const ranked: RankedFeedItem[] =
        process.env.NODE_ENV === 'test' ? getDevOnlyNewsItems() : [];
    const payload = {
        items: ranked,
        timelines: groupTimelineEvents(ranked),
        generatedAt: new Date().toISOString(),
        sourceCount: new Set(ranked.map((item) => item.providerId)).size,
    };

    return payload;
}

export function getDemoItems(): RankedFeedItem[] {
    return getDemoNewsFeed().items;
}
