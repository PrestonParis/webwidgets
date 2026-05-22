import FlexSearch from 'flexsearch';
import type {
    EventCategory,
    RankedFeedItem,
} from '@/features/news/schemas/eventSchemas';
import type { NewsFeedFilters } from '@/features/news/types/news';

export interface FeedSearchDocument {
    id: string;
    title: string;
    summary: string;
    source: string;
    providerId: string;
    categories: EventCategory[];
    publishedAt: string;
}

export class FeedSearchIndex {
    private readonly index = new FlexSearch.Index({
        tokenize: 'forward',
        cache: true,
    });
    private readonly documents = new Map<string, FeedSearchDocument>();

    add(item: RankedFeedItem) {
        const document = {
            id: item.id,
            title: item.title,
            summary: item.summary ?? '',
            source: item.source,
            providerId: item.providerId,
            categories: item.categories,
            publishedAt: item.publishedAt,
        };
        this.documents.set(item.id, document);
        this.index.add(
            item.id,
            `${document.title} ${document.summary} ${item.keywords.join(' ')}`,
        );
    }

    search(query: string) {
        if (!query.trim()) return [...this.documents.keys()];
        return this.index.search(query, 100).map(String);
    }
}

export function buildFeedSearchIndex(items: RankedFeedItem[]) {
    const index = new FeedSearchIndex();
    items.forEach((item) => index.add(item));
    return index;
}

export function filterFeedItems(
    items: RankedFeedItem[],
    filters: NewsFeedFilters,
) {
    const index = buildFeedSearchIndex(items);
    const matchingIds = new Set(index.search(filters.query));
    const now = Date.now();

    return items.filter((item) => {
        if (!matchingIds.has(item.id)) return false;
        if (
            filters.category !== 'all' &&
            !item.categories.includes(filters.category)
        )
            return false;
        if (filters.source !== 'all' && item.providerId !== filters.source)
            return false;

        const ageMs = now - new Date(item.publishedAt).getTime();
        if (filters.time === 'today' && ageMs > 24 * 60 * 60 * 1000)
            return false;
        if (filters.time === 'week' && ageMs > 7 * 24 * 60 * 60 * 1000)
            return false;
        return true;
    });
}
