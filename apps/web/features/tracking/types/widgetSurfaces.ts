export type TrackingCategory =
    | 'sleep'
    | 'workouts'
    | 'meals'
    | 'mood'
    | 'energy'
    | 'recovery'
    | 'supplements'
    | 'symptoms'
    | 'injury-soreness'
    | 'habits';

export type TrackingVisualizationMode =
    | 'quick-log'
    | 'summary'
    | 'trend'
    | 'timeline'
    | 'heatmap'
    | 'correlation';
export type TrackingTimeRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DestructuredTrackingWidgetConfig {
    sourceFeature: 'tracking';
    categoryFilter: TrackingCategory[];
    visualizationMode: TrackingVisualizationMode;
    metric: string;
    timeRange: TrackingTimeRange;
    display: 'compact' | 'expanded';
}

export const TRACKING_WIDGET_SURFACES = [
    'tracking quick log',
    'sleep summary',
    'workout summary',
    'meal summary',
    'mood trend',
    'recovery streak',
    'symptoms timeline',
    'supplement adherence',
    'tracking heatmap',
    'tracking correlations placeholder',
] as const;
