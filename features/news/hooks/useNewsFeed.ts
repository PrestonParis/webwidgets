'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNewsFeed } from '@/features/news/api/newsClient';
import { filterFeedItems } from '@/features/news/search/feedSearchIndex';
import type { NewsFeedFilters } from '@/features/news/types/news';

const defaultFilters: NewsFeedFilters = {
    category: 'all',
    source: 'all',
    time: 'latest',
    query: '',
};

export function useNewsFeed(initialFilters: Partial<NewsFeedFilters> = {}) {
    const [filters, setFilters] = useState<NewsFeedFilters>({
        ...defaultFilters,
        ...initialFilters,
    });

    const query = useQuery({
        queryKey: ['news-feed'],
        queryFn: fetchNewsFeed,
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
    });

    const items = query.data?.items ?? [];
    const filteredItems = useMemo(
        () => filterFeedItems(items, filters),
        [items, filters],
    );
    const sources = useMemo(
        () => ['all', ...new Set(items.map((item) => item.providerId))],
        [items],
    );

    return {
        ...query,
        filters,
        setFilters,
        items,
        filteredItems,
        sources,
        timelines: query.data?.timelines ?? [],
    };
}
