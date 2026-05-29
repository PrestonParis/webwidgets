'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Margin = { top: number; right: number; bottom: number; left: number };

const DEFAULT_MARGIN: Margin = { top: 16, right: 16, bottom: 32, left: 52 };

export type ChartDimensions = {
    width: number;
    height: number;
    innerWidth: number;
    innerHeight: number;
    margin: Margin;
};

export function useChartDimensions(
    height = 200,
    marginOverride?: Partial<Margin>,
): [React.RefObject<HTMLDivElement>, ChartDimensions] {
    const margin: Margin = { ...DEFAULT_MARGIN, ...marginOverride };
    const ref = useRef<HTMLDivElement>(null!);
    const [width, setWidth] = useState(300);

    const measure = useCallback(() => {
        if (ref.current) {
            const w = ref.current.getBoundingClientRect().width;
            if (w > 0) setWidth(w);
        }
    }, []);

    useEffect(() => {
        measure();
        const ro = new ResizeObserver(measure);
        if (ref.current) ro.observe(ref.current);
        return () => ro.disconnect();
    }, [measure]);

    return [
        ref,
        {
            width,
            height,
            innerWidth: Math.max(0, width - margin.left - margin.right),
            innerHeight: Math.max(0, height - margin.top - margin.bottom),
            margin,
        },
    ];
}
