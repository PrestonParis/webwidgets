'use client';

import { useState, useCallback } from 'react';

export type DateRangePreset = '7d' | '30d' | '90d' | 'all';

export interface DateRange {
    preset: DateRangePreset;
    from: string | null; // YYYY-MM-DD
    to: string | null; // YYYY-MM-DD
}

function presetToDates(preset: DateRangePreset): {
    from: string | null;
    to: string | null;
} {
    if (preset === 'all') return { from: null, to: null };
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    const from = new Date(today.getTime() - days * 86400000)
        .toISOString()
        .slice(0, 10);
    return { from, to };
}

export function useDateRange(initial: DateRangePreset = '30d'): {
    range: DateRange;
    setPreset: (preset: DateRangePreset) => void;
    setCustomRange: (from: string, to: string) => void;
} {
    const [range, setRange] = useState<DateRange>(() => {
        const { from, to } = presetToDates(initial);
        return { preset: initial, from, to };
    });

    const setPreset = useCallback((preset: DateRangePreset) => {
        const { from, to } = presetToDates(preset);
        setRange({ preset, from, to });
    }, []);

    const setCustomRange = useCallback((from: string, to: string) => {
        setRange({ preset: 'all', from, to });
    }, []);

    return { range, setPreset, setCustomRange };
}
