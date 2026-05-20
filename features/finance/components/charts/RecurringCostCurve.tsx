'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useChartDimensions } from './useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';
import type { FinanceSubscription } from '@/features/finance/types/finance';

interface RecurringCostCurveProps {
    subscriptions: FinanceSubscription[];
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
}

interface CostPoint {
    month: string;
    cost: number;
    projected: boolean;
}

function toMonthlyRate(sub: FinanceSubscription): number {
    if (sub.billingCycle === 'yearly') return sub.amount / 12;
    if (sub.billingCycle === 'weekly') return sub.amount * 4.333;
    return sub.amount;
}

function buildPoints(
    subscriptions: FinanceSubscription[],
    history: number,
    projection: number,
): CostPoint[] {
    const monthlyCost = subscriptions
        .filter((s) => s.active)
        .reduce((sum, s) => sum + toMonthlyRate(s), 0);
    const now = new Date();
    const points: CostPoint[] = [];
    for (let i = history - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        points.push({
            month: d.toISOString().slice(0, 7),
            cost: monthlyCost,
            projected: false,
        });
    }
    for (let i = 1; i <= projection; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        points.push({
            month: d.toISOString().slice(0, 7),
            cost: monthlyCost,
            projected: true,
        });
    }
    return points;
}

export function RecurringCostCurve({
    subscriptions,
    formatAmount,
    height = 160,
}: RecurringCostCurveProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 56,
        right: 12,
        top: 12,
        bottom: 28,
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        visible: boolean;
        d: CostPoint | null;
    }>({ x: 0, y: 0, visible: false, d: null });
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0) return;
        d3.select(svg).selectAll('*').remove();

        const points = buildPoints(subscriptions, 6, 3);
        const container = containerRef.current;
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr(
                'transform',
                `translate(${dims.margin.left},${dims.margin.top})`,
            );

        const xScale = d3
            .scalePoint<string>()
            .domain(points.map((p) => p.month))
            .range([0, dims.innerWidth])
            .padding(0.3);
        const maxCost = Math.max(...points.map((p) => p.cost), 1);
        const yScale = d3
            .scaleLinear()
            .domain([0, maxCost * 1.2])
            .range([dims.innerHeight, 0])
            .nice();

        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(yScale)
                    .ticks(4)
                    .tickFormat((v) => {
                        const n = +v;
                        return Math.abs(n) >= 1000
                            ? `$${(n / 1000).toFixed(0)}k`
                            : `$${n.toFixed(0)}`;
                    }),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line')
                    .attr('stroke', '#27272a')
                    .attr('stroke-dasharray', '3,3')
                    .attr('x2', dims.innerWidth);
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 10);
            });

        g.append<SVGGElement>('g')
            .attr('transform', `translate(0,${dims.innerHeight})`)
            .call(
                d3.axisBottom(xScale).tickFormat((v) => {
                    const parts = v.split('-');
                    return new Date(
                        +(parts[0] ?? '2000'),
                        +(parts[1] ?? '1') - 1,
                    ).toLocaleString('default', { month: 'short' });
                }),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line').remove();
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 10);
            });

        const actual = points.filter((p) => !p.projected);
        const projected = points.filter((p) => p.projected);

        const areaFn = d3
            .area<CostPoint>()
            .x((p) => xScale(p.month) ?? 0)
            .y0(dims.innerHeight)
            .y1((p) => yScale(p.cost))
            .curve(d3.curveMonotoneX);
        const lineFn = d3
            .line<CostPoint>()
            .x((p) => xScale(p.month) ?? 0)
            .y((p) => yScale(p.cost))
            .curve(d3.curveMonotoneX);

        if (actual.length > 1) {
            g.append('path')
                .datum(actual)
                .attr('fill', '#f97316')
                .attr('fill-opacity', 0.1)
                .attr('d', areaFn);
            g.append('path')
                .datum(actual)
                .attr('fill', 'none')
                .attr('stroke', '#f97316')
                .attr('stroke-width', 2)
                .attr('d', lineFn);
        }
        if (projected.length > 0) {
            const lastActual =
                actual.length > 0 ? actual[actual.length - 1] : undefined;
            const projAll: CostPoint[] = lastActual
                ? [lastActual, ...projected]
                : projected;
            g.append('path')
                .datum(projAll)
                .attr('fill', '#f97316')
                .attr('fill-opacity', 0.05)
                .attr('stroke', '#f97316')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '5,3')
                .attr('d', lineFn);
        }

        g.append('rect')
            .attr('width', dims.innerWidth)
            .attr('height', dims.innerHeight)
            .attr('fill', 'transparent')
            .on('mousemove', (event: MouseEvent) => {
                if (!container) return;
                const [mx] = d3.pointer(event);
                const closest = points.reduce((best, p) => {
                    const px = xScale(p.month) ?? 0;
                    return Math.abs(px - mx) <
                        Math.abs((xScale(best.month) ?? 0) - mx)
                        ? p
                        : best;
                });
                const r = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                    visible: true,
                    d: closest,
                });
            })
            .on('mouseleave', () =>
                setTooltip((p) => ({ ...p, visible: false })),
            );
    }, [subscriptions, dims, fmt, containerRef]);

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
            <FinanceChartTooltip
                x={tooltip.x}
                y={tooltip.y}
                visible={tooltip.visible}
            >
                {tooltip.d && (
                    <div className="space-y-0.5">
                        <p className="text-zinc-400 text-[10px]">
                            {tooltip.d.month}
                            {tooltip.d.projected ? ' (proj.)' : ''}
                        </p>
                        <p className="font-semibold text-orange-300">
                            {fmt(tooltip.d.cost)} / mo
                        </p>
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
