import type { DataResolver } from '@/features/widgets/types/snapshot';

export const workflowResolvers: DataResolver[] = [
    {
        key: 'workflows.recent',
        cachePolicy: { ttlSeconds: 30 },
        resolve() {
            return Promise.resolve({ workflowsAreAsync: true });
        },
    },
];
