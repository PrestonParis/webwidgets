'use client';

import { useQuery } from '@tanstack/react-query';
import type { ActivityEvent } from '@/features/activity/types/activity';

export function useActivityEvents() {
    return useQuery({
        queryKey: ['activity-events'],
        queryFn: async () => {
            const response = await fetch('/api/activity', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Activity feed failed: ${response.status}`);
            }
            const json = (await response.json()) as {
                events: ActivityEvent[];
            };
            return json.events;
        },
        refetchInterval: 60_000,
    });
}
