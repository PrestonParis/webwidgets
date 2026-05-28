'use client';

export type WidgetRuntimeStatus =
    | 'idle'
    | 'shell'
    | 'snapshot'
    | 'partial'
    | 'hydrated'
    | 'failed'
    | 'cooldown'
    | 'disabled';

export type WidgetRuntimeWeight = 'light' | 'medium' | 'heavy';

export type WidgetPriority = 'critical' | 'high' | 'normal' | 'low';

export type WidgetLoadStrategy = 'eager' | 'visible' | 'deferred' | 'manual';

export type WidgetVisibilityLevel =
    | 'visible'
    | 'near-visible'
    | 'offscreen'
    | 'background';

export type WidgetRuntimeMetadata = {
    id: string;
    category?: string;
    priority?: WidgetPriority;
    weight?: WidgetRuntimeWeight;
    defaultLoad?: WidgetLoadStrategy;
    dataKeys?: string[];
    estimatedCost?: number;
};

export type WidgetRuntimeSnapshot = {
    registered: number;
    loaded: number;
    visible: number;
    nearVisible: number;
    offscreen: number;
    background: number;
    hydrated: number;
    failed: number;
    cooldown: number;
    activeFetches: number;
    activeHydrations: number;
    paused: boolean;
    pressure: 'normal' | 'moderate' | 'high';
};

export type RuntimeWidgetRecord = {
    id: string;
    metadata: WidgetRuntimeMetadata;
    status: WidgetRuntimeStatus;
    registeredAt: number;
    loadedAt?: number;
    lastVisibleAt?: number;
    failureCount: number;
    cooldownUntil?: number;
    disabled?: boolean;
};

export type WidgetFailureReason = {
    message: string;
    resourceKey?: string;
    status?: number;
};
