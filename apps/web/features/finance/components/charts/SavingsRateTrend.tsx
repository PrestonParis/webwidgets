'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useChartDimensions } from '@/features/finance/hooks/useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';
import type { FinanceTransaction } from '@/features/finance/types/finance';

interface SavingsRateTrendProps {
    transactions: FinanceTransaction[];
    targetRate?: number | undefined;
    height?: number;
}

interface SavingsPoint {
    month: string;
    rate: number;
    income: number;
    saved: number;
}

function buildSavingsPoints(
    transactions: FinanceTransaction[],
    n: number,
): SavingsPoint[] {
    const now = new Date();
    const points: SavingsPoint[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        const month = transactions.filter((tx) =>
            (tx.date || tx.occurredOn).startsWith(key),
        );
        const income = month
            .filter((tx) => tx.type === 'income' || tx.amount > 0)
            .reduce((s, tx) => s + Math.abs(tx.amount), 0);
        const expense = month
            .filter((tx) => tx.type !== 'income' && tx.amount < 0)
            .reduce((s, tx) => s + Math.abs(tx.amount), 0);
        const saved = income - expense;
        const rate = income > 0 ? (saved / income) * 100 : 0;
        points.push({ month: key, rate, income, saved });
    }
    return points;
}

export function SavingsRateTrend({
    transactions,
    targetRate = 20,
    height = 160,
}: SavingsRateTrendProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 42,
        right: 12,
        top: 16,
        bottom: 28,
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        visible: boolean;
        d: SavingsPoint | null;
    }>({ x: 0, y: 0, visible: false, d: null });

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0) return;
        d3.select(svg).selectAll('*').remove();

        const points = buildSavingsPoints(transactions, 6);
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
        const allRates = points.map((p) => p.rate);
        const yMin = Math.min(d3.min(allRates) ?? 0, 0) - 5;
        const yMax = Math.max(d3.max(allRates) ?? 0, targetRate + 10);
        const yScale = d3
            .scaleLinear()
            .domain([yMin, yMax])
            .range([dims.innerHeight, 0])
            .nice();

        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(yScale)
                    .ticks(5)
                    .tickFormat((v) => `${+v}%`),
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

        // Zero line
        const zeroY = yScale(0);
        g.append('line')
            .attr('x1', 0)
            .attr('y1', zeroY)
            .attr('x2', dims.innerWidth)
            .attr('y2', zeroY)
            .attr('stroke', '#52525b')
            .attr('stroke-width', 1);

        // Target line
        const targetY = yScale(targetRate);
        g.append('line')
            .attr('x1', 0)
            .attr('y1', targetY)
            .attr('x2', dims.innerWidth)
            .attr('y2', targetY)
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,3');
        g.append('text')
            .attr('x', dims.innerWidth + 3)
            .attr('y', targetY + 4)
            .attr('fill', '#3b82f6')
            .attr('font-size', 9)
            .text(`${targetRate}%`);

        const areaFn = d3
            .area<SavingsPoint>()
            .x((p) => xScale(p.month) ?? 0)
            .y0(zeroY)
            .y1((p) => yScale(p.rate))
            .curve(d3.curveMonotoneX);
        const lineFn = d3
            .line<SavingsPoint>()
            .x((p) => xScale(p.month) ?? 0)
            .y((p) => yScale(p.rate))
            .curve(d3.curveMonotoneX);

        if (points.length > 1) {
            g.append('path')
                .datum(points)
                .attr('fill', '#10b981')
                .attr('fill-opacity', 0.12)
                .attr('d', areaFn);
            g.append('path')
                .datum(points)
                .attr('fill', 'none')
                .attr('stroke', '#10b981')
                .attr('stroke-width', 2)
                .attr('d', lineFn);
        }

        g.selectAll<SVGCircleElement, SavingsPoint>('circle')
            .data(points)
            .join('circle')
            .attr('cx', (p) => xScale(p.month) ?? 0)
            .attr('cy', (p) => yScale(p.rate))
            .attr('r', 3.5)
            .attr('fill', (p) => (p.rate >= 0 ? '#10b981' : '#ef4444'))
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5);

        g.append('rect')
            .attr('width', dims.innerWidth)
            .attr('height', dims.innerHeight)
            .attr('fill', 'transparent')
            .on('mousemove', (event: MouseEvent) => {
                if (!container) return;
                const [mx] = d3.pointer(event);
                const closest = points.reduce((best, p) => {
                    return Math.abs((xScale(p.month) ?? 0) - mx) <
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
    }, [transactions, targetRate, dims, containerRef]);

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
                        </p>
                        <p
                            className={`font-semibold ${tooltip.d.rate >= 0 ? 'text-emerald-300' : 'text-red-400'}`}
                        >
                            {tooltip.d.rate.toFixed(1)}% savings rate
                        </p>
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
