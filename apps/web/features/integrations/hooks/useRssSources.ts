'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createRssSource,
    fetchRssSources,
    removeRssSource,
} from '@/features/integrations/api/rssSourceClient';

const queryKey = ['integration-rss-sources'] as const;

export function useRssSources() {
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey, queryFn: fetchRssSources });
    const add = useMutation({
        mutationFn: createRssSource,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    const remove = useMutation({
        mutationFn: removeRssSource,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    return { query, add, remove };
}
