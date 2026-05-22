'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useChartDimensions } from './useChartDimensions';
import { FinanceChartTooltip } from './FinanceChartTooltip';

export interface NetWorthSnapshot {
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
}

interface FinanceLineChartProps {
    snapshots: NetWorthSnapshot[];
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
    showOverlay?: boolean;
}

export function FinanceLineChart({
    snapshots,
    formatAmount,
    height = 200,
    showOverlay = true,
}: FinanceLineChartProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 60,
        right: 12,
        top: 12,
        bottom: 28,
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        visible: boolean;
        d: NetWorthSnapshot | null;
    }>({ x: 0, y: 0, visible: false, d: null });
    const [activeLines, setActiveLines] = useState({
        netWorth: true,
        assets: true,
        liabilities: true,
    });

    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));
    const data = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0 || data.length < 2) return;

        d3.select(svg).selectAll('*').remove();
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr(
                'transform',
                `translate(${dims.margin.left},${dims.margin.top})`,
            );

        const xScale = d3
            .scaleTime()
            .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
            .range([0, dims.innerWidth]);

        const allVals = data.flatMap((d) => [
            ...(activeLines.netWorth ? [d.netWorth] : []),
            ...(activeLines.assets ? [d.assets] : []),
            ...(activeLines.liabilities ? [d.liabilities] : []),
        ]);
        const yScale = d3
            .scaleLinear()
            .domain([d3.min(allVals) ?? 0, d3.max(allVals) ?? 1])
            .nice()
            .range([dims.innerHeight, 0]);

        // Gridlines
        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(yScale)
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

        // Axes
        g.append<SVGGElement>('g')
            .attr('transform', `translate(0,${dims.innerHeight})`)
            .call(
                d3
                    .axisBottom(xScale)
                    .ticks(5)
                    .tickFormat((v) => d3.timeFormat('%b %y')(v as Date)),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line').remove();
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 11);
            });

        g.append<SVGGElement>('g')
            .call(
                d3
                    .axisLeft(yScale)
                    .ticks(4)
                    .tickFormat((n) => {
                        const v = +n;
                        return Math.abs(v) >= 1000
                            ? `$${(v / 1000).toFixed(0)}k`
                            : `$${v.toFixed(0)}`;
                    }),
            )
            .call((ax) => {
                ax.select('.domain').remove();
                ax.selectAll('line').remove();
                ax.selectAll('text')
                    .attr('fill', '#71717a')
                    .attr('font-size', 11);
            });

        const buildLine = (accessor: (d: NetWorthSnapshot) => number) =>
            d3
                .line<NetWorthSnapshot>()
                .x((d) => xScale(new Date(d.date)))
                .y((d) => yScale(accessor(d)))
                .curve(d3.curveMonotoneX);

        const buildArea = (accessor: (d: NetWorthSnapshot) => number) =>
            d3
                .area<NetWorthSnapshot>()
                .x((d) => xScale(new Date(d.date)))
                .y0(dims.innerHeight)
                .y1((d) => yScale(accessor(d)))
                .curve(d3.curveMonotoneX);

        const layers: Array<{
            key: keyof typeof activeLines;
            accessor: (d: NetWorthSnapshot) => number;
            color: string;
            dash?: string;
        }> = [
            { key: 'assets', accessor: (d) => d.assets, color: '#10b981' },
            {
                key: 'liabilities',
                accessor: (d) => d.liabilities,
                color: '#ef4444',
                dash: '4,2',
            },
            { key: 'netWorth', accessor: (d) => d.netWorth, color: '#38bdf8' },
        ];

        for (const { key, accessor, color, dash } of layers) {
            if (!activeLines[key]) continue;
            if (showOverlay && !dash) {
                g.append('path')
                    .datum(data)
                    .attr('fill', color)
                    .attr('fill-opacity', 0.07)
                    .attr('d', buildArea(accessor));
            }
            g.append('path')
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', dash ?? null)
                .attr('d', buildLine(accessor));
        }

        // Hover bisect
        const bisect = d3.bisector<NetWorthSnapshot, Date>(
            (d) => new Date(d.date),
        ).center;
        const container = containerRef.current;

        g.append('rect')
            .attr('width', dims.innerWidth)
            .attr('height', dims.innerHeight)
            .attr('fill', 'transparent')
            .on('mousemove', (event: MouseEvent) => {
                const [mx] = d3.pointer(event);
                const x0 = xScale.invert(mx);
                const idx = bisect(data, x0);
                const point = data[idx];
                if (!point || !container) return;
                const r = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - r.left,
                    y: event.clientY - r.top,
                    visible: true,
                    d: point,
                });
            })
            .on('mouseleave', () =>
                setTooltip((p) => ({ ...p, visible: false })),
            );
    }, [dims, data, activeLines, showOverlay, containerRef]);

    if (data.length < 2) {
        return (
            <div
                className="flex items-center justify-center text-sm text-zinc-500"
                style={{ height }}
            >
                <div className="text-center">
                    <p className="mb-1">
                        Net worth timeline requires historical snapshots
                    </p>
                    <p className="text-[10px] text-zinc-600">
                        Coming soon: account balance history tracking
                    </p>
                </div>
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
                    <div className="space-y-1">
                        <p className="font-semibold text-zinc-200 mb-1">
                            {new Date(tooltip.d.date).toLocaleDateString(
                                'en-US',
                                {
                                    month: 'short',
                                    day: 'numeric',
                                    year: '2-digit',
                                },
                            )}
                        </p>
                        {activeLines.netWorth && (
                            <div className="flex gap-2">
                                <span className="text-zinc-400">Net</span>
                                <span className="ml-auto font-semibold text-sky-300">
                                    {fmt(tooltip.d.netWorth)}
                                </span>
                            </div>
                        )}
                        {activeLines.assets && (
                            <div className="flex gap-2">
                                <span className="text-zinc-400">Assets</span>
                                <span className="ml-auto text-emerald-300">
                                    {fmt(tooltip.d.assets)}
                                </span>
                            </div>
                        )}
                        {activeLines.liabilities && (
                            <div className="flex gap-2">
                                <span className="text-zinc-400">
                                    Liabilities
                                </span>
                                <span className="ml-auto text-red-400">
                                    {fmt(tooltip.d.liabilities)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </FinanceChartTooltip>
            <div className="flex items-center justify-center gap-4 mt-1">
                {(
                    [
                        ['netWorth', '#38bdf8', 'Net worth'],
                        ['assets', '#10b981', 'Assets'],
                        ['liabilities', '#ef4444', 'Liabilities'],
                    ] as const
                ).map(([key, color, label]) => (
                    <button
                        key={key}
                        onClick={() =>
                            setActiveLines((p) => ({ ...p, [key]: !p[key] }))
                        }
                        className={`flex items-center gap-1.5 text-[10px] transition-opacity ${activeLines[key] ? 'opacity-100' : 'opacity-30'}`}
                    >
                        <span
                            className="w-2.5 h-0.5 inline-block"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-zinc-500">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
