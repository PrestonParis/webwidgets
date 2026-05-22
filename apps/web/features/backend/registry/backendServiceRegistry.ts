export const BACKEND_SERVICE_REGISTRY = [
    {
        id: 'intelligence',
        owner: 'features/intelligence',
        responsibilities: [
            'provider routing',
            'fallbacks',
            'confidence',
            'audits',
        ],
    },
    {
        id: 'jobs',
        owner: 'features/jobs',
        responsibilities: [
            'durable job records',
            'steps',
            'artifacts',
            'safe cancellation',
        ],
    },
    {
        id: 'actions',
        owner: 'features/actions',
        responsibilities: [
            'central action definitions',
            'approval gates',
            'audit events',
        ],
    },
    {
        id: 'automation',
        owner: 'features/automation',
        responsibilities: ['configs', 'evaluation boundaries', 'run logging'],
    },
    {
        id: 'activity',
        owner: 'features/activity',
        responsibilities: ['user-visible event feed'],
    },
    {
        id: 'audit',
        owner: 'features/audit',
        responsibilities: ['security and backend audit events'],
    },
    {
        id: 'consent',
        owner: 'features/security',
        responsibilities: ['permission checks', 'revocation boundaries'],
    },
    {
        id: 'integrations',
        owner: 'features/integrations',
        responsibilities: ['provider registry', 'connection states'],
    },
    {
        id: 'import-export',
        owner: 'features/import-export',
        responsibilities: ['parse/preview/map/import jobs'],
    },
] as const;
