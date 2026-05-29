export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;
}

export interface MetricsFilter {
    dateRange: DateRange;
    userSegment: string;
    widgetCategory: string;
    environment: string;
    modelVersion: string;
    actionType: string;
}

export const DEFAULT_DATE_RANGE: DateRange = {
    from: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
};

export const DEFAULT_FILTER: MetricsFilter = {
    dateRange: DEFAULT_DATE_RANGE,
    userSegment: '',
    widgetCategory: '',
    environment: '',
    modelVersion: '',
    actionType: '',
};

// — Shared API response shapes —

export interface DailySeries {
    date: string;
    value: number;
}

export interface OverviewStats {
    dau: number;
    wau: number;
    mau: number;
    newUsers: number;
    widgetsAdded: number;
    widgetsOpened: number;
    actionsSugg: number;
    actionsAccepted: number;
    actionsFailed: number;
    mlPredictions: number;
    mlLowConfRate: number;
    emailProcessed: number;
    queueFailures: number;
    frontendErrors: number;
    apiErrors: number;
    aiCostUsd: number;
    series: Record<string, DailySeries[]>;
}

export interface WidgetMetricRow {
    widgetType: string;
    usageCount: number;
    activeUsers: number;
    addCount: number;
    hideCount: number;
    removeCount: number;
    retentionRate: number;
    avgRenderMs: number;
    errorRate: number;
}

export interface ActionMetricRow {
    type: string;
    suggested: number;
    accepted: number;
    rejected: number;
    executed: number;
    failed: number;
    acceptanceRate: number;
    failureRate: number;
}

export interface MLMetricRow {
    task: string;
    predictions: number;
    avgConfidence: number;
    lowConfRate: number;
    fallbackRate: number;
    correctionRate: number;
    avgLatencyMs: number;
}

export interface AnalyticsEventRow {
    id: string;
    userId: string | null;
    type: string;
    source: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface CostSummary {
    provider: string;
    feature: string;
    totalUsd: number;
    calls: number;
}
