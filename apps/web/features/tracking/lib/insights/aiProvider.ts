import type { InsightProvider } from '@/features/tracking/types/insightProviders';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type {
    Insight,
    InsightConsent,
    InsightContext,
} from '@/features/tracking/types/insights';

export class AIInsightProvider implements InsightProvider {
    readonly name = 'ai';

    canProvide(entries: TrackingEntry[], consent: InsightConsent): boolean {
        void entries;
        return consent.aiAnalysis;
    }

    analyze(
        entries: TrackingEntry[],
        context: InsightContext,
    ): Promise<Insight[]> {
        void entries;
        void context;
        // Future AI insight provider will require explicit consent and summarized data.
        return Promise.resolve([]);
    }
}
