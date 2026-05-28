'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import { useChartDimensions } from './useChartDimensions';

interface DebtRatioMeterProps {
    totalAssets: number;
    totalLiabilities: number;
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
}

function getRatioStatus(ratio: number): { label: string; color: string } {
    if (ratio < 0.3) return { label: 'Healthy', color: '#10b981' };
    if (ratio < 0.6) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'High', color: '#ef4444' };
}

export function DebtRatioMeter({
    totalAssets,
    totalLiabilities,
    formatAmount,
    height = 160,
}: DebtRatioMeterProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    });
    const svgRef = useRef<SVGSVGElement>(null);
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
    const ratio =
        totalAssets > 0 ? Math.min(1, totalLiabilities / totalAssets) : 0;
    const status = getRatioStatus(ratio);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.width <= 0) return;
        d3.select(svg).selectAll('*').remove();

        const cx = dims.width / 2;
        const cy = height * 0.7;
        const r = Math.min(dims.width / 2 - 20, height * 0.58);
        const startAngle = -Math.PI * 0.78;
        const endAngle = Math.PI * 0.78;
        const g = d3.select(svg).append<SVGGElement>('g');

        const makeArc = (
            inner: number,
            outer: number,
            sA: number,
            eA: number,
        ) =>
            d3.arc()({
                innerRadius: inner,
                outerRadius: outer,
                startAngle: sA,
                endAngle: eA,
            });

        const track = makeArc(r * 0.7, r, startAngle, endAngle);
        if (track)
            g.append('path')
                .attr('d', track)
                .attr('fill', '#27272a')
                .attr('transform', `translate(${cx},${cy})`);

        const fillEnd = startAngle + (endAngle - startAngle) * ratio;
        const fill = makeArc(r * 0.7, r, startAngle, fillEnd);
        if (fill)
            g.append('path')
                .attr('d', fill)
                .attr('fill', status.color)
                .attr('opacity', 0.88)
                .attr('transform', `translate(${cx},${cy})`);

        for (const mark of [0.3, 0.6]) {
            const angle =
                startAngle + (endAngle - startAngle) * mark - Math.PI / 2;
            g.append('line')
                .attr('x1', cx + Math.cos(angle) * (r * 0.68))
                .attr('y1', cy + Math.sin(angle) * (r * 0.68))
                .attr('x2', cx + Math.cos(angle) * (r * 1.06))
                .attr('y2', cy + Math.sin(angle) * (r * 1.06))
                .attr('stroke', '#52525b')
                .attr('stroke-width', 1.5);
        }

        g.append('text')
            .attr('x', cx)
            .attr('y', cy - r * 0.1)
            .attr('text-anchor', 'middle')
            .attr('fill', status.color)
            .attr('font-size', Math.max(18, r * 0.28))
            .attr('font-weight', 700)
            .text(`${(ratio * 100).toFixed(1)}%`);
        g.append('text')
            .attr('x', cx)
            .attr('y', cy + r * 0.2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#71717a')
            .attr('font-size', 11)
            .text('debt / assets');
        g.append('text')
            .attr('x', cx)
            .attr('y', cy + r * 0.38)
            .attr('text-anchor', 'middle')
            .attr('fill', status.color)
            .attr('font-size', 10)
            .attr('font-weight', 600)
            .text(status.label);

        const assetX =
            cx + Math.cos(startAngle - Math.PI / 2 + 0.15) * (r * 1.15);
        const assetY =
            cy + Math.sin(startAngle - Math.PI / 2 + 0.15) * (r * 1.15);
        const debtX = cx + Math.cos(endAngle - Math.PI / 2 - 0.15) * (r * 1.15);
        const debtY = cy + Math.sin(endAngle - Math.PI / 2 - 0.15) * (r * 1.15);

        g.append('text')
            .attr('x', assetX)
            .attr('y', assetY)
            .attr('text-anchor', 'middle')
            .attr('fill', '#10b981')
            .attr('font-size', 9)
            .attr('font-weight', 600)
            .text(fmt(totalAssets));
        g.append('text')
            .attr('x', debtX)
            .attr('y', debtY)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ef4444')
            .attr('font-size', 9)
            .attr('font-weight', 600)
            .text(fmt(totalLiabilities));
    }, [dims.width, height, ratio, status, fmt, totalAssets, totalLiabilities]);

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
        </div>
    );
}
