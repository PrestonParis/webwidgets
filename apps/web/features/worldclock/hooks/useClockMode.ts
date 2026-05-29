'use client';

import { useState } from 'react';

export type ClockMode = 'digital' | 'military' | 'analog';

const STORAGE_KEY = 'worldclock_mode';
const DEFAULT: ClockMode = 'digital';

function loadMode(): ClockMode {
    if (typeof window === 'undefined') return DEFAULT;
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'digital' || s === 'military' || s === 'analog') return s;
    return DEFAULT;
}

export function useClockMode() {
    const [mode, setModeState] = useState<ClockMode>(() => loadMode());

    const setMode = (m: ClockMode) => {
        localStorage.setItem(STORAGE_KEY, m);
        setModeState(m);
    };

    return { mode, setMode };
}
