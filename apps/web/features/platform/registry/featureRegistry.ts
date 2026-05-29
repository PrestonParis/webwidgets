import type { FeatureDefinition } from '@/features/platform/types/feature';

export const FEATURE_REGISTRY: FeatureDefinition[] = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        route: '/',
        category: 'productivity',
        goals: ['personal-dashboard', 'productivity'],
        betaState: 'stable',
    },
    {
        id: 'tracking',
        name: 'Tracking and Logging',
        route: '/tracking',
        category: 'tracking',
        goals: ['health-tracking', 'recovery'],
        betaState: 'beta',
        requiredPermissions: ['tracking_sensitive'],
    },
    {
        id: 'finance',
        name: 'Finance',
        route: '/finance',
        category: 'finance',
        goals: ['finance'],
        betaState: 'beta',
        requiredPermissions: ['finance_data'],
    },
    {
        id: 'knowledge',
        name: 'Knowledge and Writing',
        route: '/knowledge',
        category: 'knowledge',
        goals: ['writing-knowledge', 'research', 'learning'],
        betaState: 'beta',
    },
    {
        id: 'developer',
        name: 'Developer Tools',
        route: '/developer',
        category: 'developer',
        goals: ['development'],
        betaState: 'beta',
        requiredIntegrations: ['github'],
    },
    {
        id: 'automation',
        name: 'Automation',
        route: '/automation',
        category: 'automation',
        goals: ['automation', 'productivity'],
        betaState: 'beta',
        requiredPermissions: ['automation_actions'],
    },
    {
        id: 'activity',
        name: 'Activity Feed',
        route: '/activity',
        category: 'system',
        goals: ['personal-dashboard', 'automation', 'productivity'],
        betaState: 'stable',
    },
    {
        id: 'integrations',
        name: 'Integrations',
        route: '/integrations',
        category: 'integration',
        goals: ['automation', 'development', 'personal-dashboard'],
        betaState: 'stable',
    },
];

export function getFeatureDefinition(featureId: string) {
    return FEATURE_REGISTRY.find((feature) => feature.id === featureId) ?? null;
}
