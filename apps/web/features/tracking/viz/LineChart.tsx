'use client';

import React, { useEffect, useRef } from 'react';
import { buildLineChart, type ChartDims } from './d3Utils';

interface LineChartProps {
    data: { date: string; value: number }[];
    label?: string;
    color?: string;
    height?: number;
    emptyMessage?: string;
}

export function LineChart({
    data,
    label,
    color = '#6366f1',
    height = 200,
    emptyMessage = 'No data available',
}: LineChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const parsed = data.map((d) => ({
            date: new Date(d.date),
            value: d.value,
        }));

        const dims: ChartDims = {
            width: 800,
            height,
            marginTop: 20,
            marginRight: 20,
            marginBottom: 30,
            marginLeft: 40,
        };

        buildLineChart(svgRef.current, parsed, dims, color);
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

    return (
        <div>
            {label && (
                <p className="mb-1 text-sm font-medium text-gray-600">
                    {label}
                </p>
            )}
            {React.createElement('svg', {
                ref: svgRef,
                className: 'w-full',
                viewBox: `0 0 800 ${height}`,
            })}
        </div>
    );
}
