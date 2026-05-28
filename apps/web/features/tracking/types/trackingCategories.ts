export type BuiltInCategory =
    | 'sleep'
    | 'workout'
    | 'meal'
    | 'mood'
    | 'supplement'
    | 'symptom'
    | 'injury'
    | 'health';
export type TrackingCategory = string;
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
