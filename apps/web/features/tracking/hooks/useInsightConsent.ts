'use client';

import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_INSIGHT_CONSENT } from '@/features/tracking/types/insights';
import type { InsightConsent } from '@/features/tracking/types/insights';

const CONSENT_KEY = 'tracking_insight_consent';

function loadConsent(): InsightConsent {
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return { ...DEFAULT_INSIGHT_CONSENT };
        return {
            ...DEFAULT_INSIGHT_CONSENT,
            ...(JSON.parse(raw) as Partial<InsightConsent>),
        };
    } catch {
        return { ...DEFAULT_INSIGHT_CONSENT };
    }
}

export function useInsightConsent(): {
    consent: InsightConsent;
    updateConsent: (updates: Partial<InsightConsent>) => void;
    anyConsentGranted: boolean;
} {
    const [consent, setConsent] = useState<InsightConsent>({
        ...DEFAULT_INSIGHT_CONSENT,
    });

    useEffect(() => {
        setConsent(loadConsent());
    }, []);

    const updateConsent = useCallback((updates: Partial<InsightConsent>) => {
        setConsent((prev) => {
            const next = { ...prev, ...updates };
            try {
                localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
            } catch {
                // localStorage unavailable
            }
            return next;
        });
    }, []);

    const anyConsentGranted =
        consent.aiAnalysis ||
        consent.crossCategoryCorrelations ||
        consent.externalDataImport;

    return { consent, updateConsent, anyConsentGranted };
}
