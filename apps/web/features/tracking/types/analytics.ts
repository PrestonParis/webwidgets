import type { TrackingCategory } from './trackingCategoryTypes';

export interface TrackingStats {
    category: TrackingCategory;
    count: number;
    currentStreak: number;
    longestStreak: number;
    weeklyCount: number;
    monthlyCount: number;
}

export interface RollingAverage {
    date: string;
    value: number;
    window: number;
}

export interface Trend {
    direction: 'improving' | 'declining' | 'stable';
    magnitude: number; // 0-1
    period: 'week' | 'month';
    metric: string;
}

export interface Correlation {
    categoryA: TrackingCategory;
    metricA: string;
    categoryB: TrackingCategory;
    metricB: string;
    coefficient: number; // -1 to 1
    sampleSize: number;
    significance: 'low' | 'medium' | 'high';
}

export type DataPoint = { date: string; value: number };
