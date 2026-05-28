'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChartDimensions } from './useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';

const PALETTE = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#ec4899',
    '#14b8a6',
];

interface CategoryDatum {
    category: string;
    amount: number;
}

interface InternalDatum extends CategoryDatum {
    children?: never;
}

interface RootDatum {
    name: 'root';
    children: InternalDatum[];
}

interface SpendingTreemapProps {
    breakdown: CategoryDatum[];
    formatAmount?: ((value: number) => string) | undefined;
    amountClassName?: string;
    height?: number;
}

export function SpendingTreemap({
    breakdown,
    formatAmount,
    amountClassName = '',
    height = 200,
}: SpendingTreemapProps) {
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
        d: CategoryDatum | null;
    }>({ x: 0, y: 0, visible: false, d: null });

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
    const data = breakdown.slice(0, 10);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0 || data.length === 0) return;

        const root = d3
            .hierarchy<RootDatum | InternalDatum>({
                name: 'root',
                children: data.map((d) => ({
                    category: d.category,
                    amount: d.amount,
                })),
            } as RootDatum)
            .sum((d) => ('amount' in d ? d.amount : 0))
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const layout = d3
            .treemap<RootDatum | InternalDatum>()
            .size([dims.innerWidth, dims.innerHeight])
            .paddingOuter(3)
            .paddingInner(2)
            .round(true);

        layout(root);

        const leaves = root.leaves() as d3.HierarchyRectangularNode<
            RootDatum | InternalDatum
        >[];
        const container = containerRef.current;

        d3.select(svg).selectAll('*').remove();
        const g = d3.select(svg).append<SVGGElement>('g');

        const cell = g
            .selectAll<
                SVGGElement,
                d3.HierarchyRectangularNode<RootDatum | InternalDatum>
            >('g')
            .data(leaves)
            .join('g')
            .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

        cell.append('rect')
            .attr('width', (d) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d) => Math.max(0, d.y1 - d.y0))
            .attr('fill', (_, i) => PALETTE[i % PALETTE.length] ?? '#71717a')
            .attr('fill-opacity', 0.25)
            .attr('rx', 4)
            .attr('stroke', (_, i) => PALETTE[i % PALETTE.length] ?? '#71717a')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', 1);

        cell.each(function (d, i) {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            if (w < 36 || h < 22) return;
            const node = d3.select<SVGGElement, typeof d>(this);
            const datum = d.data as InternalDatum;
            const color = PALETTE[i % PALETTE.length] ?? '#e4e4e7';

            node.append('text')
                .attr('x', w / 2)
                .attr('y', h / 2 - 6)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', color)
                .attr('font-size', Math.min(11, w / 6))
                .attr('font-weight', '600')
                .text(
                    datum.category.length > 12
                        ? datum.category.slice(0, 11) + '…'
                        : datum.category,
                );

            if (h > 40) {
                node.append('text')
                    .attr('x', w / 2)
                    .attr('y', h / 2 + 9)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', color)
                    .attr('fill-opacity', 0.75)
                    .attr('font-size', Math.min(10, w / 7))
                    .text(fmt(datum.amount));
            }
        });

        // Hover overlay rects
        cell.append('rect')
            .attr('width', (d) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d) => Math.max(0, d.y1 - d.y0))
            .attr('rx', 4)
            .attr('fill', 'transparent')
            .attr('cursor', 'pointer')
            .on('mouseenter', (event: MouseEvent, d) => {
                if (!container) return;
                const r = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                    visible: true,
                    d: d.data as InternalDatum,
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
            .on('mouseleave', () =>
                setTooltip((p) => ({ ...p, visible: false })),
            );
    }, [dims, data, fmt, containerRef]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-zinc-500"
                style={{ height }}
            >
                No spending this month
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
                {tooltip.d && (
                    <div>
                        <p className="font-semibold text-zinc-200 mb-1">
                            {tooltip.d.category}
                        </p>
                        <p
                            className={`text-base font-bold text-orange-300 ${amountClassName}`}
                        >
                            {fmt(tooltip.d.amount)}
                        </p>
                        <p className="text-zinc-500 mt-1">
                            {(
                                (tooltip.d.amount /
                                    breakdown.reduce(
                                        (s, b) => s + b.amount,
                                        1,
                                    )) *
                                100
                            ).toFixed(1)}
                            % of total spend
                        </p>
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
