import type { DeveloperToolDefinition } from '@/features/developer/types/developer';

export const DEVELOPER_TOOLS: DeveloperToolDefinition[] = [
    {
        id: 'cron-jobs',
        title: 'Cron tracker',
        description: 'Scheduled job registry and run history.',
        state: 'beta',
        requiresLocalAccess: false,
    },
    {
        id: 'docker-status',
        title: 'Docker manager',
        description: 'Container status view; no dangerous operations enabled.',
        state: 'unavailable',
        requiresLocalAccess: true,
    },
    {
        id: 'database-schema',
        title: 'Database schema',
        description: 'Schema visualizer for Supabase metadata.',
        state: 'beta',
        requiresLocalAccess: false,
    },
    {
        id: 'developer',
        title: 'Developer',
        description:
            'Developer tools including logs viewer and system resources.',
        state: 'unavailable',
        requiresLocalAccess: true,
    },
    {
        id: 'network-speed',
        title: 'Network speed',
        description: 'Network test gated behind local access permissions.',
        state: 'unavailable',
        requiresLocalAccess: true,
    },
];
