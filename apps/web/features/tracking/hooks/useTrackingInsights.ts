'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { createDefaultPipeline } from '@/features/tracking/lib/insights/insightPipeline';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type {
    InsightConsent,
    Insight,
} from '@/features/tracking/types/insights';

const pipeline = createDefaultPipeline();

export function useTrackingInsights(
    entries: TrackingEntry[],
    consent: InsightConsent,
): { insights: Insight[]; loading: boolean; refresh: () => void } {
    const { user } = useAuthContext();
    const [insightsState, setInsightsState] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [tick, setTick] = useState(0);

    const refresh = useCallback(() => {
        setTick((n) => n + 1);
    }, []);

    const anyGranted =
        consent.aiAnalysis ||
        consent.crossCategoryCorrelations ||
        consent.externalDataImport;

    useEffect(() => {
        if (!anyGranted || entries.length === 0) return;

        let cancelled = false;

        const run = async () => {
            if (!user?.id || cancelled) return;

            setLoading(true);
            try {
                const results = await pipeline.run(entries, consent, {
                    userId: user.id,
                    windowDays: 30,
                });
                if (!cancelled) setInsightsState(results);
            } catch (err) {
                console.error('[useTrackingInsights] pipeline error', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [entries, consent, tick, user, anyGranted]);

    const insights = anyGranted && entries.length > 0 ? insightsState : [];
    return { insights, loading, refresh };
}
