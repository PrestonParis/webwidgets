'use client';

import React, { useEffect, useRef } from 'react';
import { buildHeatmap } from './d3Utils';

interface HeatmapProps {
    data: { date: string; value: number }[];
    weeks?: number;
    colorFn: (v: number) => string;
}

export function Heatmap({ data, weeks = 26, colorFn }: HeatmapProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        buildHeatmap(svgRef.current, data, weeks, colorFn);
    }, [data, weeks, colorFn]);

    const cellStep = 16;
    const svgWidth = weeks * cellStep + 8;
    const svgHeight = 7 * cellStep + 8;

    return React.createElement('svg', {
        ref: svgRef,
        className: 'w-full',
        viewBox: `0 0 ${svgWidth} ${svgHeight}`,
    });
}
