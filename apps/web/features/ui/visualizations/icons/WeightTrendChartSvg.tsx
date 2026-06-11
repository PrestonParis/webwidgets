'use client';

import { useMemo } from 'react';
import {
    kgToLbs,
    type WeightEntry,
    type WeightUnit,
} from '@/features/tracking/health/lib/weightDomain';

const W = 400;
const H = 100;
const PAD = { top: 8, right: 12, bottom: 20, left: 36 };

export function WeightTrendChart({
    entries,
    unit,
}: {
    entries: WeightEntry[];
    unit: WeightUnit;
}) {
    const points = useMemo(() => {
        const slice = entries.slice(0, 30).reverse();
        if (slice.length < 2) return null;
        const weights = slice.map((e) =>
            unit === 'lbs' ? kgToLbs(e.weightKg) : e.weightKg,
        );
        const minW = Math.min(...weights) - 1;
        const maxW = Math.max(...weights) + 1;
        const rangeW = maxW - minW || 1;
        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top - PAD.bottom;
        return slice.map((_, i) => ({
            x: PAD.left + (i / (slice.length - 1)) * innerW,
            y: PAD.top + innerH - ((weights[i]! - minW) / rangeW) * innerH,
            label: weights[i]!.toFixed(1),
            date: slice[i]!.date,
        }));
    }, [entries, unit]);

    if (!points || points.length < 2) {
        return (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-zinc-500">
                Log at least 2 entries to see a trend.
            </p>
        );
    }

    const pathD = points
        .map(
            (p, i) =>
                `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        )
        .join(' ');

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Weight trend chart"
        >
            {[0.25, 0.5, 0.75].map((t) => (
                <line
                    key={t}
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={PAD.top + t * (H - PAD.top - PAD.bottom)}
                    y2={PAD.top + t * (H - PAD.top - PAD.bottom)}
                    stroke="currentColor"
                    strokeOpacity={0.06}
                    strokeWidth={1}
                />
            ))}
            <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {[points[0]!, points[points.length - 1]!].map((p) => (
                <circle key={p.date} cx={p.x} cy={p.y} r={3.5} fill="#6366f1" />
            ))}
            <text
                x={points[0]!.x}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.45}
            >
                {points[0]!.date.slice(5)}
            </text>
            <text
                x={points[points.length - 1]!.x}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.45}
            >
                {points[points.length - 1]!.date.slice(5)}
            </text>
            <text
                x={points[points.length - 1]!.x + 4}
                y={points[points.length - 1]!.y - 5}
                fontSize={9}
                fill="#6366f1"
                fontWeight="600"
            >
                {points[points.length - 1]!.label}
            </text>
        </svg>
    );
}
