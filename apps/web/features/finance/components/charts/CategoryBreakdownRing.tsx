'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChartDimensions } from '@/features/finance/hooks/useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';

export interface CategorySlice {
    category: string;
    amount: number;
}

interface CategoryBreakdownRingProps {
    breakdown: CategorySlice[];
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
    centerLabel?: string | undefined;
}

const PALETTE = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
];

export function CategoryBreakdownRing({
    breakdown,
    formatAmount,
    height = 200,
    centerLabel,
}: CategoryBreakdownRingProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        visible: boolean;
        slice: CategorySlice | null;
    }>({ x: 0, y: 0, visible: false, slice: null });

    const fmt = useMemo(
        () =>
            formatAmount ??
            ((n: number) =>
                n.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                })),
        [formatAmount],
    );
    const total = breakdown.reduce((s, d) => s + d.amount, 0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.width <= 0 || breakdown.length === 0) return;
        d3.select(svg).selectAll('*').remove();

        const size = Math.min(dims.width, height);
        const radius = size / 2 - 10;
        const innerRadius = radius * 0.56;
        const cx = dims.width / 2;
        const cy = height / 2;
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr('transform', `translate(${cx},${cy})`);
        const container = containerRef.current;

        const pie = d3
            .pie<CategorySlice>()
            .value((d) => d.amount)
            .sort(null);
        const arc = d3
            .arc<d3.PieArcDatum<CategorySlice>>()
            .innerRadius(innerRadius)
            .outerRadius(radius);
        const arcHover = d3
            .arc<d3.PieArcDatum<CategorySlice>>()
            .innerRadius(innerRadius)
            .outerRadius(radius + 7);

        g.selectAll<SVGPathElement, d3.PieArcDatum<CategorySlice>>('path')
            .data(pie(breakdown))
            .join('path')
            .attr('fill', (_, i) => PALETTE[i % PALETTE.length] ?? '#71717a')
            .attr('d', arc)
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5)
            .on('mouseenter', function (event: MouseEvent, d) {
                d3.select(this).attr('d', arcHover(d) ?? '');
                if (!container) return;
                const r = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                    visible: true,
                    slice: d.data,
                });
            })
            .on('mousemove', (event: MouseEvent) => {
                if (!container) return;
                const r = container.getBoundingClientRect();
                setTooltip((p) => ({
                    ...p,
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                }));
            })
            .on('mouseleave', function (_, d) {
                d3.select(this).attr('d', arc(d) ?? '');
                setTooltip((p) => ({ ...p, visible: false }));
            });

        const label = centerLabel ?? fmt(total);
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.15em')
            .attr('fill', '#f4f4f5')
            .attr('font-size', Math.max(11, radius * 0.2))
            .attr('font-weight', 600)
            .text(label);
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .attr('fill', '#71717a')
            .attr('font-size', 10)
            .text('total spend');
    }, [breakdown, dims.width, height, fmt, total, centerLabel, containerRef]);

    if (breakdown.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-zinc-500"
                style={{ height }}
            >
                No spending data
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
            <FinanceChartTooltip
                x={tooltip.x}
                y={tooltip.y}
                visible={tooltip.visible}
            >
                {tooltip.slice && (
                    <div className="space-y-0.5">
                        <p className="font-semibold text-zinc-200">
                            {tooltip.slice.category}
                        </p>
                        <p className="text-zinc-400">
                            {fmt(tooltip.slice.amount)}
                        </p>
                        {total > 0 && (
                            <p className="text-zinc-500 text-[10px]">
                                {((tooltip.slice.amount / total) * 100).toFixed(
                                    1,
                                )}
                                % of total
                            </p>
                        )}
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
