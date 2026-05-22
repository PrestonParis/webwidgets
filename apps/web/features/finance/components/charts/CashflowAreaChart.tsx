'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useChartDimensions } from './useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';
import type { FinanceTransaction } from '@/features/finance/types/finance';

interface MonthBucket {
    month: string;
    label: string;
    income: number;
    expenses: number;
    net: number;
}

function buildBuckets(
    transactions: FinanceTransaction[],
    n: number,
): MonthBucket[] {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'short' });
        const txs = transactions.filter((tx) =>
            (tx.date || tx.occurredOn).startsWith(prefix),
        );
        const income = txs
            .filter((tx) => tx.type === 'income' || tx.amount > 0)
            .reduce((s, tx) => s + Math.abs(tx.amount), 0);
        const expenses = txs
            .filter((tx) => tx.type === 'expense' || tx.amount < 0)
            .reduce((s, tx) => s + Math.abs(tx.amount), 0);
        return {
            month: prefix,
            label,
            income,
            expenses,
            net: income - expenses,
        };
    });
}

interface CashflowAreaChartProps {
    transactions: FinanceTransaction[];
    formatAmount?: (n: number) => string;
    height?: number;
    months?: number;
}

export function CashflowAreaChart({
    transactions,
    formatAmount,
    height = 210,
    months = 6,
}: CashflowAreaChartProps) {
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
        d: MonthBucket | null;
    }>({ x: 0, y: 0, visible: false, d: null });

    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));
    const data = buildBuckets(transactions, months);
    const hasData = data.some((b) => b.income > 0 || b.expenses > 0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0 || !hasData) return;

        const root = d3.select(svg);
        root.selectAll('*').remove();
        const g = root
            .append<SVGGElement>('g')
            .attr(
                'transform',
                `translate(${dims.margin.left},${dims.margin.top})`,
            );

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.month))
            .range([0, dims.innerWidth])
            .padding(0.3);

        const minNet = d3.min(data, (d) => d.net) ?? 0;
        const maxVal = d3.max(data, (d) => Math.max(d.income, d.expenses)) ?? 1;

        const y = d3
            .scaleLinear()
            .domain([Math.min(0, minNet * 1.15), maxVal * 1.1])
            .nice()
            .range([dims.innerHeight, 0]);

        // Gridlines
        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(y)
                    .ticks(4)
                    .tickSize(-dims.innerWidth)
                    .tickFormat(() => ''),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line')
                    .attr('stroke', '#27272a')
                    .attr('stroke-dasharray', '3,3');
            });

        // Zero baseline
        g.append('line')
            .attr('x1', 0)
            .attr('x2', dims.innerWidth)
            .attr('y1', y(0))
            .attr('y2', y(0))
            .attr('stroke', '#3f3f46')
            .attr('stroke-width', 1);

        // X axis
        g.append<SVGGElement>('g')
            .attr('transform', `translate(0,${dims.innerHeight})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat(
                        (v) => data.find((d) => d.month === v)?.label ?? '',
                    ),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line').remove();
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 11);
            });

        // Y axis
        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(y)
                    .ticks(4)
                    .tickFormat((n) => {
                        const v = +n;
                        return Math.abs(v) >= 1000
                            ? `$${(v / 1000).toFixed(0)}k`
                            : `$${Math.abs(v).toFixed(0)}`;
                    }),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line').remove();
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 11);
            });

        const bw = x.bandwidth() / 2 - 1;

        // Income bars
        g.selectAll<SVGRectElement, MonthBucket>('.bar-in')
            .data(data)
            .join('rect')
            .attr('class', 'bar-in')
            .attr('x', (d) => x(d.month) ?? 0)
            .attr('y', (d) => y(d.income))
            .attr('width', bw)
            .attr('height', (d) => Math.max(0, dims.innerHeight - y(d.income)))
            .attr('fill', '#10b981')
            .attr('fill-opacity', 0.8)
            .attr('rx', 2);

        // Expense bars
        g.selectAll<SVGRectElement, MonthBucket>('.bar-ex')
            .data(data)
            .join('rect')
            .attr('class', 'bar-ex')
            .attr('x', (d) => (x(d.month) ?? 0) + bw + 2)
            .attr('y', (d) => y(d.expenses))
            .attr('width', bw)
            .attr('height', (d) =>
                Math.max(0, dims.innerHeight - y(d.expenses)),
            )
            .attr('fill', '#f97316')
            .attr('fill-opacity', 0.8)
            .attr('rx', 2);

        // Net cashflow line
        const line = d3
            .line<MonthBucket>()
            .x((d) => (x(d.month) ?? 0) + x.bandwidth() / 2)
            .y((d) => y(d.net))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,3')
            .attr('d', line);

        g.selectAll<SVGCircleElement, MonthBucket>('.dot-net')
            .data(data)
            .join('circle')
            .attr('class', 'dot-net')
            .attr('cx', (d) => (x(d.month) ?? 0) + x.bandwidth() / 2)
            .attr('cy', (d) => y(d.net))
            .attr('r', 3.5)
            .attr('fill', '#38bdf8')
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5);

        // Hover overlay
        const container = containerRef.current;
        g.selectAll<SVGRectElement, MonthBucket>('.hover-zone')
            .data(data)
            .join('rect')
            .attr('class', 'hover-zone')
            .attr('x', (d) => x(d.month) ?? 0)
            .attr('y', 0)
            .attr('width', x.bandwidth())
            .attr('height', dims.innerHeight)
            .attr('fill', 'transparent')
            .on('mouseenter', (event: MouseEvent, d) => {
                if (!container) return;
                const r = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                    visible: true,
                    d,
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
    }, [dims, data, hasData, containerRef]);

    return (
        <div ref={containerRef} className="relative w-full">
            {!hasData ? (
                <div
                    className="flex items-center justify-center text-sm text-zinc-500"
                    style={{ height }}
                >
                    Add transactions to see cashflow
                </div>
            ) : (
                <svg ref={svgRef} style={{ width: '100%', height }} />
            )}
            <FinanceChartTooltip
                x={tooltip.x}
                y={tooltip.y}
                visible={tooltip.visible}
            >
                {tooltip.d && (
                    <div className="space-y-1.5">
                        <p className="font-semibold text-zinc-200 mb-1">
                            {tooltip.d.label}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block shrink-0" />
                            <span className="text-zinc-400">Income</span>
                            <span className="ml-auto font-medium text-emerald-300">
                                {fmt(tooltip.d.income)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-orange-400 inline-block shrink-0" />
                            <span className="text-zinc-400">Expenses</span>
                            <span className="ml-auto font-medium text-orange-300">
                                {fmt(tooltip.d.expenses)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 border-t border-zinc-700 pt-1">
                            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block shrink-0" />
                            <span className="text-zinc-400">Net</span>
                            <span
                                className={`ml-auto font-semibold ${tooltip.d.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {fmt(tooltip.d.net)}
                            </span>
                        </div>
                    </div>
                )}
            </FinanceChartTooltip>
            {hasData && (
                <div className="flex items-center justify-center gap-5 mt-1">
                    <LegendDot color="bg-emerald-400/80" label="Income" />
                    <LegendDot color="bg-orange-400/80" label="Expenses" />
                    <LegendLine label="Net cashflow" />
                </div>
            )}
        </div>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className={`w-2.5 h-2.5 rounded-sm inline-block ${color}`} />
            {label}
        </span>
    );
}

function LegendLine({ label }: { label: string }) {
    return (
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <svg width="16" height="8">
                <line
                    x1="0"
                    y1="4"
                    x2="16"
                    y2="4"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                />
            </svg>
            {label}
        </span>
    );
}
