import { useState, useCallback } from 'react';
import {
    loadPreferences,
    savePreferences,
} from '@/features/reading/lib/readingStorage';
import type { ReadingPreferences } from '@/features/reading/types/plans';

export function useReadingPreferences() {
    const [prefs, setPrefs] = useState<ReadingPreferences>(loadPreferences);

    const update = useCallback((patch: Partial<ReadingPreferences>) => {
        setPrefs((prev) => {
            const next = { ...prev, ...patch };
            savePreferences(next);
            return next;
        });
    }, []);

    return { prefs, update };
}
