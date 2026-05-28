'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import { useChartDimensions } from '@/features/finance/hooks/useChartDimensions';

interface EmergencyFundRunwayProps {
    cashTotal: number;
    monthlyExpenses: number;
    formatAmount?: ((n: number) => string) | undefined;
    height?: number;
}

const MILESTONES = [
    { months: 1, label: '1mo', color: '#f59e0b' },
    { months: 3, label: '3mo', color: '#10b981' },
    { months: 6, label: '6mo', color: '#3b82f6' },
] as const;

const MAX_MONTHS = 8;

function getRunwayColor(months: number): string {
    if (months >= 6) return '#3b82f6';
    if (months >= 3) return '#10b981';
    if (months >= 1) return '#f59e0b';
    return '#ef4444';
}

export function EmergencyFundRunwayChart({
    cashTotal,
    monthlyExpenses,
    formatAmount,
    height = 96,
}: EmergencyFundRunwayProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 12,
        right: 12,
        top: 28,
        bottom: 24,
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
    const currentMonths = monthlyExpenses > 0 ? cashTotal / monthlyExpenses : 0;
    const fillColor = getRunwayColor(currentMonths);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.innerWidth <= 0) return;
        d3.select(svg).selectAll('*').remove();
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr(
                'transform',
                `translate(${dims.margin.left},${dims.margin.top})`,
            );

        const xScale = d3
            .scaleLinear()
            .domain([0, MAX_MONTHS])
            .range([0, dims.innerWidth]);
        const trackH = 12;
        const trackY = (dims.innerHeight - trackH) / 2;

        g.append('rect')
            .attr('x', 0)
            .attr('y', trackY)
            .attr('width', dims.innerWidth)
            .attr('height', trackH)
            .attr('rx', 6)
            .attr('fill', '#27272a');

        const fillWidth = xScale(Math.min(currentMonths, MAX_MONTHS));
        if (fillWidth > 0) {
            g.append('rect')
                .attr('x', 0)
                .attr('y', trackY)
                .attr('width', fillWidth)
                .attr('height', trackH)
                .attr('rx', 6)
                .attr('fill', fillColor)
                .attr('opacity', 0.85);
        }

        for (const { months, label, color } of MILESTONES) {
            const x = xScale(months);
            g.append('line')
                .attr('x1', x)
                .attr('y1', trackY - 5)
                .attr('x2', x)
                .attr('y2', trackY + trackH + 5)
                .attr('stroke', color)
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '2,2');
            g.append('text')
                .attr('x', x)
                .attr('y', trackY - 8)
                .attr('text-anchor', 'middle')
                .attr('fill', color)
                .attr('font-size', 9)
                .text(label);
        }

        const labelX = Math.max(
            8,
            Math.min(xScale(currentMonths), dims.innerWidth - 8),
        );
        g.append('text')
            .attr('x', labelX)
            .attr('y', trackY + trackH + 14)
            .attr('text-anchor', 'middle')
            .attr('fill', fillColor)
            .attr('font-size', 10)
            .attr('font-weight', 600)
            .text(`${currentMonths.toFixed(1)}mo`);

        const summaryText = `${fmt(cashTotal)} cash · ${currentMonths >= 1 ? `${currentMonths.toFixed(1)} months` : '< 1 month'} runway`;
        g.append('text')
            .attr('x', dims.innerWidth / 2)
            .attr('y', -12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#71717a')
            .attr('font-size', 10)
            .text(summaryText);
    }, [dims, currentMonths, cashTotal, fmt, fillColor]);

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
        </div>
    );
}
