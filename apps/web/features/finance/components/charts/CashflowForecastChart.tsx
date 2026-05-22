'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useChartDimensions } from './useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';
import type { FinanceTransaction } from '@/features/finance/types/finance';

interface CashflowForecastChartProps {
    transactions: FinanceTransaction[];
    projectedMonthlyIncome?: number | undefined;
    projectedMonthlyExpense?: number | undefined;
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
}

interface ForecastBucket {
    month: string;
    income: number;
    expense: number;
    net: number;
    projected: boolean;
}

function buildBuckets(
    transactions: FinanceTransaction[],
    income: number,
    expense: number,
): ForecastBucket[] {
    const map = new Map<string, { income: number; expense: number }>();
    for (const tx of transactions) {
        const key = (tx.date || tx.occurredOn).slice(0, 7);
        const entry = map.get(key) ?? { income: 0, expense: 0 };
        if (tx.type === 'income' || tx.amount > 0)
            entry.income += Math.abs(tx.amount);
        else entry.expense += Math.abs(tx.amount);
        map.set(key, entry);
    }
    const now = new Date();
    const buckets: ForecastBucket[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        const entry = map.get(key) ?? { income: 0, expense: 0 };
        buckets.push({
            month: key,
            income: entry.income,
            expense: entry.expense,
            net: entry.income - entry.expense,
            projected: false,
        });
    }
    for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = d.toISOString().slice(0, 7);
        buckets.push({
            month: key,
            income,
            expense,
            net: income - expense,
            projected: true,
        });
    }
    return buckets;
}

export function CashflowForecastChart({
    transactions,
    projectedMonthlyIncome = 0,
    projectedMonthlyExpense = 0,
    formatAmount,
    height = 180,
}: CashflowForecastChartProps) {
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
        d: ForecastBucket | null;
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

        const buckets = buildBuckets(
            transactions,
            projectedMonthlyIncome,
            projectedMonthlyExpense,
        );
        const container = containerRef.current;
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr(
                'transform',
                `translate(${dims.margin.left},${dims.margin.top})`,
            );

        const xScale = d3
            .scaleBand<string>()
            .domain(buckets.map((b) => b.month))
            .range([0, dims.innerWidth])
            .paddingInner(0.15)
            .paddingOuter(0.1);
        const maxVal = Math.max(
            ...buckets.flatMap((b) => [b.income, b.expense]),
            1,
        );
        const yScale = d3
            .scaleLinear()
            .domain([0, maxVal * 1.1])
            .range([dims.innerHeight, 0])
            .nice();
        const bw = xScale.bandwidth() / 2 - 1;

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

        for (const b of buckets) {
            const x = xScale(b.month) ?? 0;
            const opacity = b.projected ? 0.4 : 0.8;
            g.append('rect')
                .attr('x', x)
                .attr('y', yScale(b.income))
                .attr('width', bw)
                .attr('height', dims.innerHeight - yScale(b.income))
                .attr('fill', '#10b981')
                .attr('opacity', opacity)
                .attr('rx', 2);
            g.append('rect')
                .attr('x', x + bw + 2)
                .attr('y', yScale(b.expense))
                .attr('width', bw)
                .attr('height', dims.innerHeight - yScale(b.expense))
                .attr('fill', '#f97316')
                .attr('opacity', opacity)
                .attr('rx', 2);
            if (b.projected) {
                g.append('rect')
                    .attr('x', x - 1)
                    .attr('y', 0)
                    .attr('width', xScale.bandwidth() + 2)
                    .attr('height', dims.innerHeight)
                    .attr('fill', 'none')
                    .attr('stroke', '#3f3f46')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '3,3')
                    .attr('rx', 2);
            }
        }

        g.append('rect')
            .attr('width', dims.innerWidth)
            .attr('height', dims.innerHeight)
            .attr('fill', 'transparent')
            .on('mousemove', (event: MouseEvent) => {
                if (!container) return;
                const [mx] = d3.pointer(event);
                const closest = buckets.reduce((best, b) => {
                    const bx = (xScale(b.month) ?? 0) + xScale.bandwidth() / 2;
                    return Math.abs(bx - mx) <
                        Math.abs(
                            (xScale(best.month) ?? 0) +
                                xScale.bandwidth() / 2 -
                                mx,
                        )
                        ? b
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
    }, [
        transactions,
        projectedMonthlyIncome,
        projectedMonthlyExpense,
        dims,
        containerRef,
    ]);

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
            <FinanceChartTooltip
                x={tooltip.x}
                y={tooltip.y}
                visible={tooltip.visible}
            >
                {tooltip.d && (
                    <div className="space-y-1">
                        <p className="text-zinc-400 text-[10px]">
                            {tooltip.d.month}
                            {tooltip.d.projected ? ' (forecast)' : ''}
                        </p>
                        <div className="flex gap-2">
                            <span className="text-zinc-400">Income</span>
                            <span className="ml-auto text-emerald-300">
                                {fmt(tooltip.d.income)}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-zinc-400">Expense</span>
                            <span className="ml-auto text-orange-300">
                                {fmt(tooltip.d.expense)}
                            </span>
                        </div>
                        <div className="flex gap-2 border-t border-zinc-700 pt-1">
                            <span className="text-zinc-400">Net</span>
                            <span
                                className={`ml-auto font-semibold ${tooltip.d.net >= 0 ? 'text-emerald-300' : 'text-red-400'}`}
                            >
                                {fmt(tooltip.d.net)}
                            </span>
                        </div>
                    </div>
                )}
            </FinanceChartTooltip>
        </div>
    );
}
