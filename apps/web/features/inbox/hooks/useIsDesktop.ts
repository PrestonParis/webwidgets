'use client';

import { useEffect, useState } from 'react';

// Returns true when viewport width >= 1024px (lg breakpoint).
// Defaults to false on first render (SSR-safe — assume mobile until measured).
export function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isDesktop;
}

export function useIsXl(): boolean {
    const [isXl, setIsXl] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1280px)');
        setIsXl(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsXl(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isXl;
}
