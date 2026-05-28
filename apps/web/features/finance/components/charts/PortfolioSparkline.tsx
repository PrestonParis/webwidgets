'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface SparkPoint {
    value: number;
    date: string;
}

interface PortfolioSparklineProps {
    points: SparkPoint[];
    width?: number;
    height?: number;
}

export function PortfolioSparkline({
    points,
    width = 80,
    height = 32,
}: PortfolioSparklineProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0]?.value ?? 0;
    const last = sorted.at(-1)?.value ?? 0;
    const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
    const color =
        trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#71717a';

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || sorted.length < 2) return;

        const mt = 4;
        const mb = 4;
        const ml = 2;
        const mr = 2;
        const innerW = width - ml - mr;
        const innerH = height - mt - mb;

        d3.select(svg).selectAll('*').remove();
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr('transform', `translate(${ml},${mt})`);

        const xScale = d3
            .scaleLinear()
            .domain([0, sorted.length - 1])
            .range([0, innerW]);
        const ext = d3.extent(sorted, (d) => d.value) as [number, number];
        const pad = (ext[1] - ext[0]) * 0.1 || 1;
        const yScale = d3
            .scaleLinear()
            .domain([ext[0] - pad, ext[1] + pad])
            .range([innerH, 0]);

        // Area fill
        const area = d3
            .area<SparkPoint>()
            .x((_, i) => xScale(i))
            .y0(innerH)
            .y1((d) => yScale(d.value))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(sorted)
            .attr('fill', color)
            .attr('fill-opacity', 0.12)
            .attr('d', area);

        // Line
        const line = d3
            .line<SparkPoint>()
            .x((_, i) => xScale(i))
            .y((d) => yScale(d.value))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(sorted)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('d', line);

        // Last point dot
        const lastPoint = sorted.at(-1);
        if (lastPoint) {
            g.append('circle')
                .attr('cx', xScale(sorted.length - 1))
                .attr('cy', yScale(lastPoint.value))
                .attr('r', 2)
                .attr('fill', color);
        }
    }, [sorted, width, height, color]);

    if (sorted.length < 2) {
        return (
            <div
                style={{ width, height }}
                className="flex items-center justify-center"
            >
                <span className="text-[10px] text-zinc-600">—</span>
            </div>
        );
    }

    return <svg ref={svgRef} width={width} height={height} />;
}

// Wrapper hook: derive spark points from watchlist readings for inline use
export function useSparkPoints(
    readings: Array<{ value: number; fetchedAt: string }>,
): SparkPoint[] {
    return readings.map((r) => ({
        value: r.value,
        date: r.fetchedAt.slice(0, 10),
    }));
}
