'use client';

import React, { useEffect, useRef } from 'react';
import { buildBarChart, type ChartDims } from './d3Utils';

interface BarChartProps {
    data: { label: string; value: number }[];
    color?: string;
    height?: number;
    emptyMessage?: string;
}

export function BarChart({
    data,
    color = '#6366f1',
    height = 200,
    emptyMessage = 'No data available',
}: BarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const dims: ChartDims = {
            width: 800,
            height,
            marginTop: 20,
            marginRight: 20,
            marginBottom: 40,
            marginLeft: 40,
        };

        buildBarChart(svgRef.current, data, dims, color);
    }, [data, color, height]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-gray-400"
                style={{ height }}
            >
                {emptyMessage}
            </div>
        );
    }

    return React.createElement('svg', {
        ref: svgRef,
        className: 'w-full',
        viewBox: `0 0 800 ${height}`,
    });
}
