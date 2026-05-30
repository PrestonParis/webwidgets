'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChartDimensions } from '@/features/finance/hooks/useChartDimensions';
import { FinanceChartTooltip } from '@/features/ui/visualizations/components/FinanceChartTooltip';
import type { FinanceAccount } from '@/features/finance/types/finance';

interface PortfolioAllocationChartProps {
    accounts: FinanceAccount[];
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
}

interface Slice {
    type: string;
    total: number;
    color: string;
}

const TYPE_COLORS: Record<string, string> = {
    cash: '#10b981',
    checking: '#34d399',
    savings: '#6ee7b7',
    investment: '#3b82f6',
    credit: '#ef4444',
    loan: '#f97316',
    other: '#8b5cf6',
};

function buildSlices(accounts: FinanceAccount[]): Slice[] {
    const map = new Map<string, number>();
    for (const acc of accounts) {
        if (acc.balance <= 0) continue;
        map.set(acc.type, (map.get(acc.type) ?? 0) + acc.balance);
    }
    return [...map.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([type, total]) => ({
            type,
            total,
            color: TYPE_COLORS[type] ?? '#71717a',
        }));
}

export function PortfolioAllocationChart({
    accounts,
    formatAmount,
    height = 200,
}: PortfolioAllocationChartProps) {
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
        slice: Slice | null;
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
    const slices = buildSlices(accounts);
    const total = slices.reduce((s, sl) => s + sl.total, 0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.width <= 0 || slices.length === 0) return;
        d3.select(svg).selectAll('*').remove();
        const container = containerRef.current;

        const donutW = Math.min(dims.width * 0.42, height);
        const barW = dims.width - donutW - 16;
        const r = donutW / 2 - 8;
        const innerR = r * 0.55;
        const cx = donutW / 2;
        const cy = height / 2;

        const g = d3.select(svg).append<SVGGElement>('g');
        const donutG = g
            .append<SVGGElement>('g')
            .attr('transform', `translate(${cx},${cy})`);
        const barG = g
            .append<SVGGElement>('g')
            .attr('transform', `translate(${donutW + 16}, ${height * 0.1})`);

        const pie = d3
            .pie<Slice>()
            .value((d) => d.total)
            .sort(null);
        const arc = d3
            .arc<d3.PieArcDatum<Slice>>()
            .innerRadius(innerR)
            .outerRadius(r);
        const arcHover = d3
            .arc<d3.PieArcDatum<Slice>>()
            .innerRadius(innerR)
            .outerRadius(r + 6);

        donutG
            .selectAll<SVGPathElement, d3.PieArcDatum<Slice>>('path')
            .data(pie(slices))
            .join('path')
            .attr('fill', (d) => d.data.color)
            .attr('d', arc)
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5)
            .on('mouseenter', function (event: MouseEvent, d) {
                d3.select(this).attr('d', arcHover(d) ?? '');
                if (!container) return;
                const rect = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    visible: true,
                    slice: d.data,
                });
            })
            .on('mousemove', (event: MouseEvent) => {
                if (!container) return;
                const rect = container.getBoundingClientRect();
                setTooltip((p) => ({
                    ...p,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                }));
            })
            .on('mouseleave', function (_, d) {
                d3.select(this).attr('d', arc(d) ?? '');
                setTooltip((p) => ({ ...p, visible: false }));
            });

        donutG
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.1em')
            .attr('fill', '#f4f4f5')
            .attr('font-size', Math.max(10, r * 0.22))
            .attr('font-weight', 600)
            .text(fmt(total));
        donutG
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .attr('fill', '#71717a')
            .attr('font-size', 9)
            .text('total assets');

        const barH = Math.min(14, (height * 0.8) / slices.length - 4);
        const barScale = d3.scaleLinear().domain([0, total]).range([0, barW]);
        const yStep = (height * 0.8) / Math.max(slices.length, 1);

        slices.forEach((sl, i) => {
            const y = i * yStep;
            const pct = total > 0 ? (sl.total / total) * 100 : 0;
            barG.append('rect')
                .attr('x', 0)
                .attr('y', y + (yStep - barH) / 2)
                .attr('width', barScale(sl.total))
                .attr('height', barH)
                .attr('rx', 3)
                .attr('fill', sl.color)
                .attr('opacity', 0.8);
            barG.append('text')
                .attr('x', barScale(sl.total) + 5)
                .attr('y', y + yStep / 2 + 1)
                .attr('fill', '#a1a1aa')
                .attr('font-size', 9)
                .attr('dominant-baseline', 'middle')
                .text(`${sl.type} ${pct.toFixed(0)}%`);
        });
    }, [accounts, slices, total, dims.width, height, fmt, containerRef]);

    if (slices.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-zinc-500"
                style={{ height }}
            >
                No positive-balance accounts
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
                            {tooltip.slice.type}
                        </p>
                        <p className="text-zinc-400">
                            {fmt(tooltip.slice.total)}
                        </p>
                        {total > 0 && (
                            <p className="text-zinc-500 text-[10px]">
                                {((tooltip.slice.total / total) * 100).toFixed(
                                    1,
                                )}
                                % of portfolio
                            </p>
                        )}
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
