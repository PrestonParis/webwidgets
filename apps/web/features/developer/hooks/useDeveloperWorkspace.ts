'use client';

import { useQuery } from '@tanstack/react-query';
import type { DeveloperWorkspaceSnapshot } from '@/features/developer/schemas/infrastructureSchemas';

export function useDeveloperWorkspace() {
    return useQuery({
        queryKey: ['developer-workspace'],
        queryFn: async () => {
            const response = await fetch('/api/developer/workspace', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Developer workspace failed: ${response.status}`);
            }
            return (await response.json()) as DeveloperWorkspaceSnapshot;
        },
        refetchInterval: 30_000,
    });
}
