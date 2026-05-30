/**
 * Route metadata for traversal testing
 *
 * This file defines metadata for all routes in the application,
 * including categories, authentication requirements, integration dependencies,
 * expected load times, and criticality flags.
 */

export type RouteCategory = 'core' | 'feature' | 'admin' | 'experimental';
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RouteMetadata {
    path: string;
    category: RouteCategory;
    requiresAuth: boolean;
    requiresIntegrations: string[];
    expectedLoadTime: number; // ms
    testPriority: TestPriority;
    critical: boolean;
    skipReason?: string;
    description?: string;
}

export const ROUTE_METADATA: RouteMetadata[] = [
    // Core routes
    {
        path: '/',
        category: 'core',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'critical',
        critical: true,
        description: 'Main dashboard',
    },
    {
        path: '/dashboard',
        category: 'core',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'critical',
        critical: true,
        description: 'Dashboard view',
    },

    // Feature routes
    {
        path: '/finance',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['plaid', 'finance'],
        expectedLoadTime: 3000,
        testPriority: 'high',
        critical: false,
        description: 'Finance tracking',
    },
    {
        path: '/recovery',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Recovery tracking',
    },
    {
        path: '/creative',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Creative studio',
    },
    {
        path: '/collaboration',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['linear', 'google'],
        expectedLoadTime: 3000,
        testPriority: 'medium',
        critical: false,
        description: 'Collaboration tools',
    },
    {
        path: '/reading',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Reading list',
    },
    {
        path: '/memorization',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Memorization tools',
    },
    {
        path: '/accessibility',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Accessibility tools',
    },
    {
        path: '/command-center',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Command center',
    },
    {
        path: '/search',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 1500,
        testPriority: 'high',
        critical: false,
        description: 'Search',
    },
    {
        path: '/files',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['drive', 's3'],
        expectedLoadTime: 3000,
        testPriority: 'high',
        critical: false,
        description: 'Files management',
    },
    {
        path: '/metrics',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Metrics overview',
    },

    // Admin routes
    {
        path: '/admin',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Admin overview',
    },
    {
        path: '/admin/overview',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Admin overview',
    },
    {
        path: '/admin/users',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'User management',
    },
    {
        path: '/admin/metrics',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'System metrics',
    },
    {
        path: '/admin/errors',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Error logs',
    },
    {
        path: '/admin/jobs',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Job queue',
    },
    {
        path: '/admin/widgets',
        category: 'admin',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Widget management',
    },

    // Other feature routes
    {
        path: '/calendar',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['google'],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Calendar',
    },
    {
        path: '/chat',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'AI Chat',
    },
    {
        path: '/chess',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['lichess'],
        expectedLoadTime: 2000,
        testPriority: 'low',
        critical: false,
        description: 'Chess',
    },
    {
        path: '/inbox',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['gmail'],
        expectedLoadTime: 3000,
        testPriority: 'high',
        critical: false,
        description: 'Email inbox',
    },
    {
        path: '/journal',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Journal',
    },
    {
        path: '/todo',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'To-Do list',
    },
    {
        path: '/habit',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'medium',
        critical: false,
        description: 'Habit tracker',
    },
    {
        path: '/weather',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['weather'],
        expectedLoadTime: 2000,
        testPriority: 'low',
        critical: false,
        description: 'Weather',
    },
    {
        path: '/currency',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'low',
        critical: false,
        description: 'Currency converter',
    },
    {
        path: '/automation',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: ['n8n'],
        expectedLoadTime: 3000,
        testPriority: 'high',
        critical: false,
        description: 'Automation center',
    },
    {
        path: '/integrations',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Integrations management',
    },
    {
        path: '/settings',
        category: 'feature',
        requiresAuth: true,
        requiresIntegrations: [],
        expectedLoadTime: 2000,
        testPriority: 'high',
        critical: false,
        description: 'Settings',
    },
];

/**
 * Get route metadata by path
 */
export function getRouteMetadata(path: string): RouteMetadata | undefined {
    return ROUTE_METADATA.find((route) => route.path === path);
}

/**
 * Get routes by category
 */
export function getRoutesByCategory(category: RouteCategory): RouteMetadata[] {
    return ROUTE_METADATA.filter((route) => route.category === category);
}

/**
 * Get routes by priority
 */
export function getRoutesByPriority(priority: TestPriority): RouteMetadata[] {
    return ROUTE_METADATA.filter((route) => route.testPriority === priority);
}

/**
 * Get critical routes
 */
export function getCriticalRoutes(): RouteMetadata[] {
    return ROUTE_METADATA.filter((route) => route.critical);
}

/**
 * Get routes that should be skipped
 */
export function getSkippedRoutes(): RouteMetadata[] {
    return ROUTE_METADATA.filter((route) => route.skipReason);
}
