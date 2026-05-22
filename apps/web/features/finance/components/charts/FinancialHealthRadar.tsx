'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { useChartDimensions } from './useChartDimensions';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';
import { filterToCurrentMonth } from '@/features/finance/lib/financeAggregations';

interface HealthMetric {
    label: string;
    score: number;
    hint: string;
}

function computeMetrics(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): HealthMetric[] {
    const thisMonth = filterToCurrentMonth(transactions);
    const income = thisMonth
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const expenses = thisMonth
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const cash = accounts
        .filter((a) => ['cash', 'checking', 'savings'].includes(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const debt = accounts
        .filter((a) => ['credit', 'loan'].includes(a.type))
        .reduce((s, a) => s + Math.abs(a.balance), 0);
    const assets = accounts
        .filter((a) => a.balance > 0)
        .reduce((s, a) => s + a.balance, 0);
    const subCost = subscriptions
        .filter((s) => s.active)
        .reduce((sum, s) => {
            if (s.billingCycle === 'yearly' || s.cadence === 'annual')
                return sum + s.amount / 12;
            if (s.billingCycle === 'weekly' || s.cadence === 'weekly')
                return sum + s.amount * 4.33;
            return sum + s.amount;
        }, 0);

    const net = income - expenses - subCost;
    const emergencyTarget = expenses * 3;

    return [
        {
            label: 'Cashflow',
            score: income > 0 ? Math.min(1, Math.max(0, net / income)) : 0,
            hint:
                net >= 0
                    ? `+${net.toFixed(0)} this month`
                    : `${net.toFixed(0)} this month`,
        },
        {
            label: 'Debt ratio',
            score:
                assets > 0
                    ? Math.min(1, Math.max(0, 1 - debt / assets))
                    : debt === 0
                      ? 0.8
                      : 0,
            hint:
                assets > 0
                    ? `${((debt / assets) * 100).toFixed(0)}% of assets`
                    : 'No asset data',
        },
        {
            label: 'Emergency fund',
            score:
                emergencyTarget > 0
                    ? Math.min(1, Math.max(0, cash / emergencyTarget))
                    : cash > 0
                      ? 0.6
                      : 0,
            hint: `${(cash / Math.max(expenses, 1)).toFixed(1)}mo runway`,
        },
        {
            label: 'Savings rate',
            score:
                income > 0
                    ? Math.min(1, Math.max(0, (income - expenses) / income))
                    : 0,
            hint:
                income > 0
                    ? `${(((income - expenses) / income) * 100).toFixed(0)}% saved`
                    : 'No income data',
        },
        {
            label: 'Sub burden',
            score:
                income > 0
                    ? Math.min(1, Math.max(0, 1 - subCost / (income * 0.25)))
                    : subCost === 0
                      ? 1
                      : 0.5,
            hint: `$${subCost.toFixed(0)}/mo in subs`,
        },
        {
            label: 'Data richness',
            score: Math.min(
                1,
                (accounts.length > 0 ? 0.35 : 0) +
                    (transactions.length > 0 ? 0.35 : 0) +
                    (subscriptions.length > 0 ? 0.3 : 0),
            ),
            hint: `${accounts.length}a ${transactions.length}tx ${subscriptions.length}sub`,
        },
    ];
}

interface FinancialHealthRadarProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    height?: number;
}

export function FinancialHealthRadar({
    accounts,
    transactions,
    subscriptions,
    height = 220,
}: FinancialHealthRadarProps) {
    const [containerRef, dims] = useChartDimensions(height, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const metrics = computeMetrics(accounts, transactions, subscriptions);

    const cx = dims.width / 2;
    const cy = height / 2;
    const r = Math.min(cx, cy) - 36;

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || dims.width <= 0) return;

        d3.select(svg).selectAll('*').remove();
        const g = d3
            .select(svg)
            .append<SVGGElement>('g')
            .attr('transform', `translate(${cx},${cy})`);

        const n = metrics.length;
        const angleStep = (2 * Math.PI) / n;
        const angles = metrics.map((_, i) => i * angleStep - Math.PI / 2);
        const rScale = d3.scaleLinear().domain([0, 1]).range([0, r]);

        // Background rings
        [0.25, 0.5, 0.75, 1].forEach((level) => {
            const pts = angles.map(
                (a) =>
                    [
                        Math.cos(a) * rScale(level),
                        Math.sin(a) * rScale(level),
                    ] as [number, number],
            );
            g.append('polygon')
                .attr('points', pts.map((p) => p.join(',')).join(' '))
                .attr('fill', 'none')
                .attr('stroke', '#27272a')
                .attr('stroke-width', 1);
        });

        // Axis spokes
        angles.forEach((a) => {
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', Math.cos(a) * r)
                .attr('y2', Math.sin(a) * r)
                .attr('stroke', '#3f3f46')
                .attr('stroke-width', 1);
        });

        // Data polygon
        const dataPoints = metrics.map(
            (m, i) =>
                [
                    Math.cos(angles[i]!) * rScale(m.score),
                    Math.sin(angles[i]!) * rScale(m.score),
                ] as [number, number],
        );

        const area = d3
            .lineRadial<[number, number]>()
            .angle((_, i) => angles[i] ?? 0)
            .radius((d) => rScale(d[1] > 0 ? d[1] : 0));

        g.append('path')
            .datum(dataPoints)
            .attr('fill', '#10b981')
            .attr('fill-opacity', 0.12)
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2)
            .attr('d', area([...dataPoints, dataPoints[0]!]));

        g.selectAll<SVGCircleElement, [number, number]>('.score-dot')
            .data(dataPoints)
            .join('circle')
            .attr('class', 'score-dot')
            .attr('cx', (d) => d[0])
            .attr('cy', (d) => d[1])
            .attr('r', 3)
            .attr('fill', '#10b981')
            .attr('stroke', '#18181b')
            .attr('stroke-width', 1.5);

        // Labels
        const labelR = r + 22;
        metrics.forEach((m, i) => {
            const a = angles[i]!;
            const lx = Math.cos(a) * labelR;
            const ly = Math.sin(a) * labelR;

            g.append('text')
                .attr('x', lx)
                .attr('y', ly)
                .attr(
                    'text-anchor',
                    Math.cos(a) > 0.1
                        ? 'start'
                        : Math.cos(a) < -0.1
                          ? 'end'
                          : 'middle',
                )
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#a1a1aa')
                .attr('font-size', 10)
                .attr('font-weight', '500')
                .text(m.label);
        });
    }, [dims, metrics, cx, cy, r]);

    const overallScore =
        metrics.reduce((s, m) => s + m.score, 0) / metrics.length;
    const scoreColor =
        overallScore >= 0.7
            ? 'text-emerald-400'
            : overallScore >= 0.4
              ? 'text-amber-400'
              : 'text-red-400';

    return (
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} style={{ width: '100%', height }} />
            <div className="absolute top-2 right-3 text-right">
                <p className={`text-xl font-bold ${scoreColor}`}>
                    {(overallScore * 100).toFixed(0)}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                    / 100
                </p>
            </div>
        </div>
    );
}
