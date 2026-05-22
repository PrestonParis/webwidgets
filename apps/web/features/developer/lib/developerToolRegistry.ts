import type { DeveloperToolDefinition } from '@/features/developer/types/developer';

export const DEVELOPER_TOOLS: DeveloperToolDefinition[] = [
    {
        id: 'api-tester',
        title: 'API tester',
        description: 'Request builder for safe endpoint testing.',
        state: 'beta',
        requiresLocalAccess: false,
    },
    {
        id: 'logs-stream',
        title: 'Logs viewer',
        description:
            'Log stream viewer gated behind service permissions.',
        state: 'requires_permission',
        requiresLocalAccess: true,
    },
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
        id: 'system-monitor',
        title: 'System resources',
        description: 'Resource monitor gated by permissions.',
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
