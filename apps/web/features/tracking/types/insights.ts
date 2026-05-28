import type { TrackingCategory } from './trackingCategoryTypes';

export interface InsightConsent {
    aiAnalysis: boolean;
    crossCategoryCorrelations: boolean;
    externalDataImport: boolean;
}

export const DEFAULT_INSIGHT_CONSENT: InsightConsent = {
    aiAnalysis: false,
    crossCategoryCorrelations: false,
    externalDataImport: false,
};

export interface Insight {
    id: string;
    category: TrackingCategory;
    title: string;
    body: string;
    confidence: 'low' | 'medium' | 'high';
    source: 'rule-based' | 'ai';
    generatedAt: string;
    relatedCategories: TrackingCategory[];
}

export interface InsightContext {
    userId: string;
    windowDays: number;
}
