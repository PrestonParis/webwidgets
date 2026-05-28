import type {
    TrackingCapability,
    TrackingMetricType,
} from './trackingCategories';

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
