'use client';

import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import type {
    WidgetRuntimeMetadata,
    WidgetPriority,
    WidgetLoadStrategy,
} from './widgetRuntimeTypes';
import { PRIORITY_SCORES, WEIGHT_SCORES } from './dashboardRuntimeConfig';

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
    config: WidgetConfig,
): WidgetRuntimeMetadata {
    const weight = determineWeight(config.type);
    const priority = determinePriority(config.type);
    const defaultLoad = determineLoadStrategy(weight, priority);
    const estimatedCost = estimateCost(weight, priority);

    const metadata: WidgetRuntimeMetadata = {
        id: config.id,
        priority,
        weight,
        defaultLoad,
        dataKeys: DATA_KEYS[config.type] ?? [],
        estimatedCost,
    };

    const category = config.type.split('-')[0];
    if (category) metadata.category = category;

    return metadata;
}
