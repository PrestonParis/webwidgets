'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNewsFeed } from '@/features/news/api/newsClient';
import { filterFeedItems } from '@/features/news/search/feedSearchIndex';
import type { RankedFeedItem } from '@/features/news/schemas/eventSchemas';
import type { NewsFeedFilters } from '@/features/news/types/news';

const defaultFilters: NewsFeedFilters = {
    category: 'all',
    source: 'all',
    time: 'latest',
    query: '',
};

async function applyMlRanking(
    items: RankedFeedItem[],
    userTopics: string[],
): Promise<RankedFeedItem[]> {
    try {
        const res = await fetch('/api/ml/rank-news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: items.map((i) => ({
                    id: i.id,
                    title: i.title,
                    description: i.summary ?? '',
                    category: i.categories[0] ?? 'world',
                })),
                user_topics: userTopics,
            }),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return items;
        const data = await res.json() as { ranked?: { id: string; relevance_score: number }[] };
        if (!data.ranked?.length) return items;
        const scoreMap = new Map(data.ranked.map((r) => [r.id, r.relevance_score]));
        return [...items].sort((a, b) => (scoreMap.get(b.id) ?? b.rankScore) - (scoreMap.get(a.id) ?? a.rankScore));
    } catch {
        return items;
    }
}

export function useNewsFeed(initialFilters: Partial<NewsFeedFilters> = {}, userTopics: string[] = []) {
    const [filters, setFilters] = useState<NewsFeedFilters>({
        ...defaultFilters,
        ...initialFilters,
    });
    const [mlRankedItems, setMlRankedItems] = useState<RankedFeedItem[] | null>(null);
    const [mlRanked, setMlRanked] = useState(false);
    const prevItemCountRef = useRef(0);

    const query = useQuery({
        queryKey: ['news-feed'],
        queryFn: fetchNewsFeed,
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
    });

    const rawItems = query.data?.items ?? [];

    useEffect(() => {
        if (!rawItems.length || rawItems.length === prevItemCountRef.current) return;
        prevItemCountRef.current = rawItems.length;
        void applyMlRanking(rawItems, userTopics).then((ranked) => {
            setMlRankedItems(ranked);
            setMlRanked(true);
        });
    }, [rawItems.length, userTopics]);

    const items = mlRankedItems ?? rawItems;
    const filteredItems = useMemo(
        () => filterFeedItems(items, filters),
        [items, filters],
    );
    const sources = useMemo(
        () => ['all', ...new Set(rawItems.map((item) => item.providerId))],
        [rawItems],
    );

    return {
        ...query,
        filters,
        setFilters,
        items,
        filteredItems,
        sources,
        timelines: query.data?.timelines ?? [],
        mlRanked,
    };
}
