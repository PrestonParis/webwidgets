'use client';

import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import type {
    WidgetRuntimeMetadata,
    WidgetPriority,
    WidgetLoadStrategy,
} from '../types/widgetRuntime';
import { PRIORITY_SCORES, WEIGHT_SCORES } from './dashboardRuntimeConfig';
import {
    getWidgetManifest,
    getDataKeysFromManifest,
} from './widgetManifestRegistry';

const CRITICAL_WIDGET_TYPES = new Set([
    'clock',
    'notes',
    'weather',
    'tasks',
    'search',
    'quick-actions',
]);

const HIGH_PRIORITY_WIDGET_TYPES = new Set([
    'calendar',
    'tracking',
    'tracking-health',
    'tracking-meal',
    'tracking-supplements',
    'currency',
]);

const HEAVY_WIDGET_TYPES = new Set([
    'developer',
    'chat',
    'files',
    'reading',
    'view',
    'finance',
    'collaboration',
    'memorization',
    'creative',
    'context-diagram',
    'widget-builder',
]);

const MEDIUM_WIDGET_TYPES = new Set([
    'automation',
    'email',
    'chess',
    'news',
    'accessibility',
]);

const DATA_KEYS: Partial<Record<WidgetConfig['type'], string[]>> = {
    developer: ['/api/developer/workspace'],
    chat: ['/api/chat/conversations', '/api/chat/model-keys'],
    calendar: ['/api/calendar/events'],
    files: ['/api/uploads'],
    reading: ['/api/bible', '/api/uploads'],
    view: ['/api/uploads'],
    collaboration: [
        '/api/collaboration/workspaces',
        '/api/collaboration/handoffs',
    ],
    memorization: ['/api/memory/cards', '/api/memory/decks'],
    creative: ['/api/creative/projects'],
    accessibility: ['/api/accessibility/settings'],
    automation: ['/api/command/workstreams'],
    tracking: ['/api/tracking/goals'],
    'tracking-supplements': ['/api/supplements'],
    chess: ['/api/chess/latest'],
    news: ['/api/news/feed'],
    currency: ['/api/currency/rates'],
};

function determinePriority(type: string): WidgetPriority {
    if (CRITICAL_WIDGET_TYPES.has(type)) return 'critical';
    if (HIGH_PRIORITY_WIDGET_TYPES.has(type)) return 'high';
    return 'normal';
}

function determineWeight(type: string): 'light' | 'medium' | 'heavy' {
    if (HEAVY_WIDGET_TYPES.has(type)) return 'heavy';
    if (MEDIUM_WIDGET_TYPES.has(type)) return 'medium';
    return 'light';
}

function determineLoadStrategy(
    weight: 'light' | 'medium' | 'heavy',
    priority: WidgetPriority,
): WidgetLoadStrategy {
    if (priority === 'critical') return 'eager';
    if (weight === 'heavy') return 'deferred';
    return 'visible';
}

function estimateCost(
    weight: 'light' | 'medium' | 'heavy',
    priority: WidgetPriority,
): number {
    const weightScore = WEIGHT_SCORES[weight];
    const priorityScore = PRIORITY_SCORES[priority];
    // Lower cost = should hydrate earlier
    return weightScore * 10 - priorityScore;
}

export function getWidgetRuntimeMetadata(
    config: Pick<WidgetConfig, 'id' | 'type'>,
): WidgetRuntimeMetadata {
    const weight = determineWeight(config.type);
    const priority = determinePriority(config.type);
    const defaultLoad = determineLoadStrategy(weight, priority);
    const estimatedCost = estimateCost(weight, priority);

    // Prefer manifest registry (typed, import/export-aware) over legacy DATA_KEYS.
    // Fall back to DATA_KEYS for widget types not yet in the manifest registry.
    const manifestDataKeys = getDataKeysFromManifest(config.type);
    const legacyDataKeys = DATA_KEYS[config.type] ?? [];
    const dataKeys = [...new Set([...manifestDataKeys, ...legacyDataKeys])];
    const manifest = getWidgetManifest(config.type);
    // Override priority from manifest if specified
    const effectivePriority = manifest?.priority ?? priority;

    const metadata: WidgetRuntimeMetadata = {
        id: config.id,
        priority: effectivePriority,
        weight,
        defaultLoad,
        dataKeys,
        estimatedCost,
    };

    const category = config.type.split('-')[0];
    if (category) metadata.category = category;

    return metadata;
}
