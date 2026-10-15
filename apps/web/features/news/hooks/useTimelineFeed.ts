'use client';

import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTimelineFeed } from '@/features/news/api/timelineFeedClient';
import { useOnlineStatus } from '@/features/news/hooks/useOnlineStatus';
import type { TimelineFilters } from '@/features/news/types/timelineFeed';

const initialFilters: TimelineFilters = {
    sourceTypes: [],
    eventTypes: [],
    from: null,
    to: null,
};

export function useTimelineFeed() {
    const [filters, setFilters] = useState(initialFilters);
    const isOnline = useOnlineStatus();
    const query = useInfiniteQuery({
        queryKey: ['timeline-feed', filters],
        queryFn: ({ pageParam }) => fetchTimelineFeed(filters, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (page) => page.nextCursor,
        staleTime: 60_000,
        refetchInterval: isOnline ? 5 * 60_000 : false,
    });
    const items = useMemo(
        () => query.data?.pages.flatMap((page) => page.items) ?? [],
        [query.data?.pages],
    );
    const firstPage = query.data?.pages[0];
    return {
        ...query,
        filters,
        setFilters,
        items,
        sources: firstPage?.sources ?? [],
        sourceHealthUnavailable: firstPage?.sourceHealthUnavailable ?? false,
        availableSourceTypes: firstPage?.availableSourceTypes ?? [],
        availableEventTypes: firstPage?.availableEventTypes ?? [],
        isOnline,
    };
}
