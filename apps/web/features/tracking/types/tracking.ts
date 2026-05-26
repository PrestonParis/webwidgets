export type BuiltInCategory =
    | 'sleep'
    | 'workout'
    | 'meal'
    | 'mood'
    | 'supplement'
    | 'symptom'
    | 'injury'
    | 'health';
export type TrackingCategory = string; // built-in or user-defined custom category
export type EntrySource =
    | 'manual'
    | 'import'
    | 'apple_health'
    | 'google_fit'
    | 'fitbit'
    | 'garmin'
    | 'oura';
export type TrackingMetricType =
    | 'rating'
    | 'boolean'
    | 'duration'
    | 'count'
    | 'measurement'
    | 'journal'
    | 'multi'
    | 'custom';
export type TrackingCapability =
    | 'streaks'
    | 'correlations'
    | 'goals'
    | 'predictions'
    | 'automation'
    | 'journal'
    | 'attachments';
export type TrackingAutomationType =
    | 'streak_risk'
    | 'threshold_crossed'
    | 'missing_log'
    | 'recovery_suggested'
    | 'correlation_review'
    | 'goal_progress';
export type TrackingActionInputType =
    | 'category'
    | 'metric'
    | 'date'
    | 'number'
    | 'text'
    | 'boolean';

export type TrackingMetricConfig = {
    key: string;
    label: string;
    type: TrackingMetricType;
    unit?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
    precision?: number | undefined;
};

export type TrackingCategoryConfig = {
    id: string;
    label: string;
    icon: string;
    color?: string | undefined;
    metricType: TrackingMetricType;
    supports: TrackingCapability[];
    primaryMetric?: string | undefined;
    metrics: TrackingMetricConfig[];
    automationEvents?: string[] | undefined;
};

export type TrackingPrediction = {
    id: string;
    label: string;
    confidence: number;
    reason: string;
    category?: string;
    suggestedActionId?: string;
};

export type TrackingActionDefinition = {
    id: string;
    label: string;
    description: string;
    requiredInputs: Array<{
        key: string;
        label: string;
        type: TrackingActionInputType;
        optional?: boolean;
    }>;
    widgetTarget?: string;
    routeTarget?: string;
    handler: (
        input: Record<string, unknown>,
    ) => Promise<{ ok: boolean; message: string }>;
};

export type TrackingAutomationRule = {
    id: string;
    label: string;
    type: TrackingAutomationType;
    enabled: boolean;
    category?: string;
    conditions: Record<string, unknown>;
    action: {
        type: 'notify' | 'open_widget' | 'suggest_entry' | 'review';
        label: string;
        target?: string;
    };
};

// Detailed per-category metadata types are in ./metadata
export type TrackingMetadata = Record<string, unknown>;

export interface TrackingEntry {
    id: string;
    userId: string;
    category: TrackingCategory;
    entryDate: string; // YYYY-MM-DD
    loggedAt: string; // ISO datetime
    metadata: TrackingMetadata;
    tags: string[];
    notes?: string;
    source: EntrySource;
    createdAt: string;
}

export type BaseTrackingEntry = Omit<
    TrackingEntry,
    'id' | 'userId' | 'loggedAt' | 'createdAt'
>;

export interface FetchOptions {
    category?: TrackingCategory;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    limit?: number;
}

export interface DbTrackingRow {
    id: string;
    user_id: string;
    category: string;
    entry_date: string;
    logged_at: string;
    metadata: Record<string, unknown>;
    tags: string[];
    notes: string | null;
    source: string;
    created_at: string;
}
