/**
 * Widget metadata for traversal testing
 *
 * This file extends the existing widget registry with test-specific metadata,
 * including test priorities, expected render times, and validation requirements.
 */

import { listWidgetManifests } from '@/features/widgets/registry/widgetManifest';

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WidgetTestMetadata {
    id: string;
    type: string;
    feature: string;
    title: string;
    dataNeeds: string[];
    refreshPolicy: 'on-load' | 'background' | 'static' | 'realtime';
    fallbackMode: 'error-card' | 'stale-cache' | 'empty' | 'skeleton';
    testPriority: TestPriority;
    requiresAuth: boolean;
    requiresIntegrations: string[];
    expectedRenderTime: number; // ms
    validateMount: boolean;
    validateShell: boolean;
    validateLoading: boolean;
    validateEmpty: boolean;
    validateError: boolean;
    skipReason?: string;
}

/**
 * Test priority mapping based on widget importance
 */
const WIDGET_PRIORITY_MAP: Record<string, TestPriority> = {
    // Critical widgets
    finance: 'critical',
    email: 'critical',
    calendar: 'critical',
    todo: 'critical',
    tracking: 'critical',

    // High priority
    recovery: 'high',
    files: 'high',
    inbox: 'high',
    automation: 'high',
    developer: 'high',

    // Medium priority
    weather: 'medium',
    currency: 'medium',
    journal: 'medium',
    habit: 'medium',
    chat: 'medium',

    // Low priority
    chess: 'low',
    texteditor: 'low',
    worldclock: 'low',
    mood: 'low',
    timekeeping: 'low',
};

/**
 * Integration requirements mapping
 */
const WIDGET_INTEGRATIONS: Record<string, string[]> = {
    finance: ['plaid', 'finance'],
    email: ['gmail'],
    calendar: ['google'],
    files: ['drive', 's3'],
    inbox: ['gmail'],
    automation: ['n8n'],
    weather: ['weather'],
    chess: ['lichess'],
};

/**
 * Expected render times (ms)
 */
const WIDGET_RENDER_TIMES: Record<string, number> = {
    finance: 1500,
    email: 2000,
    calendar: 1500,
    todo: 1000,
    tracking: 1000,
    recovery: 1000,
    files: 2000,
    inbox: 2000,
    automation: 1500,
    developer: 1500,
    weather: 1000,
    currency: 500,
    journal: 500,
    habit: 500,
    chat: 1000,
    chess: 1000,
    texteditor: 500,
    worldclock: 500,
    mood: 500,
    timekeeping: 500,
};

/**
 * Build widget test metadata from existing manifests
 */
export function buildWidgetTestMetadata(): WidgetTestMetadata[] {
    const manifests = listWidgetManifests();

    return manifests.map((manifest) => {
        const priority = WIDGET_PRIORITY_MAP[manifest.id] || 'medium';
        const integrations = WIDGET_INTEGRATIONS[manifest.id] || [];
        const renderTime = WIDGET_RENDER_TIMES[manifest.id] || 1000;

        const refreshPolicy: 'on-load' | 'background' | 'static' | 'realtime' =
            manifest.refreshPolicy === 'realtime'
                ? 'realtime'
                : manifest.refreshPolicy === 'background'
                  ? 'background'
                  : manifest.refreshPolicy === 'static'
                    ? 'static'
                    : 'on-load';

        const fallbackMode:
            | 'error-card'
            | 'stale-cache'
            | 'empty'
            | 'skeleton' =
            manifest.fallbackMode === 'error-card'
                ? 'error-card'
                : manifest.fallbackMode === 'stale-cache'
                  ? 'stale-cache'
                  : manifest.fallbackMode === 'empty'
                    ? 'empty'
                    : 'skeleton';

        return {
            id: manifest.id,
            type: manifest.id,
            feature: manifest.feature,
            title: manifest.title,
            dataNeeds: manifest.dataNeeds,
            refreshPolicy,
            fallbackMode,
            testPriority: priority,
            requiresAuth: true,
            requiresIntegrations: integrations,
            expectedRenderTime: renderTime,
            validateMount: true,
            validateShell: true,
            validateLoading: refreshPolicy !== 'static',
            validateEmpty: fallbackMode === 'empty',
            validateError: fallbackMode === 'error-card',
        };
    });
}

/**
 * Get widget test metadata by ID
 */
export function getWidgetTestMetadata(
    id: string,
): WidgetTestMetadata | undefined {
    const metadata = buildWidgetTestMetadata();
    return metadata.find((w) => w.id === id);
}

/**
 * Get widgets by priority
 */
export function getWidgetsByPriority(
    priority: TestPriority,
): WidgetTestMetadata[] {
    const metadata = buildWidgetTestMetadata();
    return metadata.filter((w) => w.testPriority === priority);
}

/**
 * Get critical widgets
 */
export function getCriticalWidgets(): WidgetTestMetadata[] {
    return getWidgetsByPriority('critical');
}

/**
 * Get widgets that require specific integration
 */
export function getWidgetsByIntegration(
    integration: string,
): WidgetTestMetadata[] {
    const metadata = buildWidgetTestMetadata();
    return metadata.filter((w) => w.requiresIntegrations.includes(integration));
}

/**
 * Get widgets that should be skipped
 */
export function getSkippedWidgets(): WidgetTestMetadata[] {
    const metadata = buildWidgetTestMetadata();
    return metadata.filter((w) => w.skipReason);
}

/**
 * Get widgets by refresh policy
 */
export function getWidgetsByRefreshPolicy(
    policy: 'on-load' | 'background' | 'static',
): WidgetTestMetadata[] {
    const metadata = buildWidgetTestMetadata();
    return metadata.filter((w) => w.refreshPolicy === policy);
}
