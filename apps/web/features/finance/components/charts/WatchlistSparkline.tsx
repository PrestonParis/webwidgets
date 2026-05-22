'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { WatchlistReading } from '@/features/finance/types/watchlist';

interface WatchlistSparklineProps {
    readings: WatchlistReading[];
    priceTarget?: number | undefined;
    width?: number;
    height?: number;
    currency?: string | undefined;
}

function trendColor(readings: WatchlistReading[]): string {
    const first = readings[0];
    const last = readings[readings.length - 1];
    if (!first || !last || readings.length < 2) return '#71717a';
    if (last.value > first.value) return '#10b981';
    if (last.value < first.value) return '#ef4444';
    return '#71717a';
}

export function WatchlistSparkline({
    readings,
    priceTarget,
    width = 80,
    height = 36,
    currency,
}: WatchlistSparklineProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const sorted = [...readings].sort((a, b) =>
        a.fetchedAt.localeCompare(b.fetchedAt),
    );
    const color = trendColor(sorted);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || sorted.length < 2) return;
        d3.select(svg).selectAll('*').remove();

        const pad = 3;
        const xScale = d3
            .scaleLinear()
            .domain([0, sorted.length - 1])
            .range([pad, width - pad]);
        const vals = sorted.map((r) => r.value);
        const allVals =
            priceTarget !== undefined ? [...vals, priceTarget] : vals;
        const yScale = d3
            .scaleLinear()
            .domain([d3.min(allVals) ?? 0, d3.max(allVals) ?? 1])
            .range([height - pad, pad])
            .nice();

        const lineFn = d3
            .line<WatchlistReading>()
            .x((_, i) => xScale(i))
            .y((r) => yScale(r.value))
            .curve(d3.curveMonotoneX);

        const areaFn = d3
            .area<WatchlistReading>()
            .x((_, i) => xScale(i))
            .y0(height - pad)
            .y1((r) => yScale(r.value))
            .curve(d3.curveMonotoneX);

        const g = d3.select(svg).append<SVGGElement>('g');

        g.append('path')
            .datum(sorted)
            .attr('fill', color)
            .attr('fill-opacity', 0.1)
            .attr('d', areaFn);
        g.append('path')
            .datum(sorted)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('d', lineFn);

        if (priceTarget !== undefined) {
            const ty = yScale(priceTarget);
            g.append('line')
                .attr('x1', pad)
                .attr('y1', ty)
                .attr('x2', width - pad)
                .attr('y2', ty)
                .attr('stroke', '#f59e0b')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,2');
        }

        // Volume bars at bottom (relative height)
        const maxVal = d3.max(vals) ?? 1;
        const barH = height * 0.18;
        sorted.forEach((_, i) => {
            const relH = ((vals[i] ?? 0) / maxVal) * barH;
            g.append('rect')
                .attr('x', xScale(i) - 1)
                .attr('y', height - relH - pad)
                .attr('width', 2)
                .attr('height', relH)
                .attr('fill', color)
                .attr('opacity', 0.25);
        });

        const last = sorted[sorted.length - 1];
        if (!last) return;
        g.append('circle')
            .attr('cx', xScale(sorted.length - 1))
            .attr('cy', yScale(last.value))
            .attr('r', 2.5)
            .attr('fill', color)
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5);
    }, [sorted, color, width, height, priceTarget]);

    if (sorted.length < 2) {
        return (
            <div
                style={{ width, height }}
                className="flex items-center justify-center text-zinc-600 text-[9px]"
            >
                —
            </div>
        );
    }

    const last = sorted[sorted.length - 1];
    const prev = sorted[0];
    if (!last || !prev) return null;
    const change =
        prev.value !== 0 ? ((last.value - prev.value) / prev.value) * 100 : 0;
    const fmt = (n: number) =>
        n >= 1000
            ? n.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currency ?? 'USD',
                  maximumFractionDigits: 0,
              })
            : n.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currency ?? 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });

    return (
        <div className="flex flex-col items-end gap-0.5">
            <svg ref={svgRef} width={width} height={height} />
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-200">
                    {fmt(last.value)}
                </span>
                <span
                    className={`text-[10px] font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                    {change >= 0 ? '+' : ''}
                    {change.toFixed(2)}%
                </span>
            </div>
        </div>
    );
}
