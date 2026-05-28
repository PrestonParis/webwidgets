import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type {
    Insight,
    InsightConsent,
    InsightContext,
} from '@/features/tracking/types/insights';

export interface InsightProvider {
    readonly name: string;
    canProvide(entries: TrackingEntry[], consent: InsightConsent): boolean;
    analyze(
        entries: TrackingEntry[],
        context: InsightContext,
    ): Promise<Insight[]>;
}
