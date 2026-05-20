'use client';

import { useState } from 'react';
import type {
    LayoutMode,
    SnapRule,
} from '@/features/dashboard/types/dashboard';

function readLS<T extends string>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    return (localStorage.getItem(key) as T | null) ?? fallback;
}

export function useDashboardMode() {
    const [mode, setModeState] = useState<LayoutMode>(() =>
        readLS('dash_mode', 'grid'),
    );
    const [snapRule, setSnapRuleState] = useState<SnapRule>(() =>
        readLS('dash_snap', 'grid'),
    );

    function setMode(m: LayoutMode) {
        setModeState(m);
        localStorage.setItem('dash_mode', m);
    }

    function setSnapRule(s: SnapRule) {
        setSnapRuleState(s);
        localStorage.setItem('dash_snap', s);
    }

    return { mode, setMode, snapRule, setSnapRule };
}
