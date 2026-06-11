'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

export function useActivityUnreadCount() {
    return useQuery({
        queryKey: ['activity-unread-count'],
        queryFn: async (): Promise<number> => {
            const res = await apiRouteFetch('/api/activity/unread-count', {
                credentials: 'include',
            });
            // Fail silently — unread badge should never break layout
            if (!res.ok) return 0;
            const json = (await res.json()) as { count?: number };
            return json.count ?? 0;
        },
        refetchInterval: 60_000,
        staleTime: 30_000,
        // Never throw — return 0 on any error
        retry: false,
    });
}
