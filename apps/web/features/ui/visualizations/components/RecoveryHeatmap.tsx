'use client';

import { toDateKey } from '@/features/recovery/lib/relapses';
import {
    useRecoveryHeatmap,
    cellColor,
    CELL,
} from '@/features/recovery/hooks/useRecoveryHeatmap';
import { HeatmapLegend } from './HeatmapLegend';
import { RecoveryHeatmapProps } from '@/features/recovery/types/recovery';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const GAP = 2;

function HeatmapGrid({
    weeks,
    startTime,
    relapseDays,
    setTooltip,
}: {
    weeks: (Date | null)[][];
    startTime: string;
    relapseDays: Set<string>;
    setTooltip: (t: { text: string; x: number; y: number } | null) => void;
}) {
    return (
        <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                    {week.map((day, di) => (
                        <div
                            key={di}
                            style={{
                                width: CELL,
                                height: CELL,
                                borderRadius: 2,
                                background: cellColor(
                                    day,
                                    startTime,
                                    relapseDays,
                                ),
                                cursor: day ? 'pointer' : 'default',
                            }}
                            onMouseEnter={(e) => {
                                if (!day) return;
                                const key = toDateKey(day);
                                setTooltip({
                                    text: `${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}: ${relapseDays.has(key) ? 'relapsed' : 'clean'}`,
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function RecoveryHeatmap({
    trackerId,
    startTime,
}: RecoveryHeatmapProps) {
    const { relapseDays, weeks, tooltip, setTooltip } =
        useRecoveryHeatmap(trackerId);

    return (
        <div className="relative">
            <div className="flex gap-1 items-start">
                <div className="flex flex-col mt-5" style={{ gap: GAP }}>
                    {DAY_LABELS.map((d, i) => (
                        <span
                            key={i}
                            className="text-[8px] text-gray-300 dark:text-zinc-600 font-bold leading-none"
                            style={{
                                width: 10,
                                height: CELL,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {i % 2 === 0 ? d : ''}
                        </span>
                    ))}
                </div>
                <div>
                    <div className="relative h-5 mb-0.5">
                        {weeks.map((week, wi) => {
                            const firstDay = week.find((d) => d !== null);
                            if (!firstDay) return null;
                            const prevFirst =
                                wi > 0
                                    ? (weeks[wi - 1]?.find((d) => d !== null) ??
                                      null)
                                    : null;
                            if (
                                prevFirst &&
                                prevFirst.getMonth() === firstDay.getMonth()
                            )
                                return null;
                            return (
                                <span
                                    key={wi}
                                    className="absolute text-[9px] text-gray-400 dark:text-zinc-500"
                                    style={{ left: wi * (CELL + GAP) }}
                                >
                                    {MONTH_SHORT[firstDay.getMonth()]}
                                </span>
                            );
                        })}
                    </div>
                    <HeatmapGrid
                        weeks={weeks}
                        startTime={startTime}
                        relapseDays={relapseDays}
                        setTooltip={setTooltip}
                    />
                </div>
            </div>
            <HeatmapLegend />
            {tooltip && (
                <div
                    className="fixed z-50 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded-lg pointer-events-none shadow-lg whitespace-nowrap"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 28 }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
}
