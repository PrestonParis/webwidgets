'use client';

import { toDateKey } from '@/features/recovery/lib/relapses';
import {
    useRecoveryHeatmap,
    cellColor,
    CELL,
} from '@/features/recovery/hooks/useRecoveryHeatmap';
import { HeatmapLegend } from './HeatmapLegend';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
    trackerId: string;
    startTime: string;
}

export default function RecoveryHeatmap({ trackerId, startTime }: Props) {
    const { relapseDays, weeks, tooltip, setTooltip } =
        useRecoveryHeatmap(trackerId);

    return (
        <div className="relative">
            <div className="flex gap-0.5 mb-1">
                {DAY_LABELS.map((d, i) => (
                    <span
                        key={i}
                        className="text-[8px] text-gray-300 dark:text-zinc-600 font-bold"
                        style={{ width: CELL, textAlign: 'center' }}
                    >
                        {i % 2 === 0 ? d : ''}
                    </span>
                ))}
            </div>

            <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
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
                                        text: `${day.toLocaleDateString()} — ${relapseDays.has(key) ? 'relapsed' : 'clean'}`,
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

            <HeatmapLegend />

            {tooltip && (
                <div
                    className="fixed z-50 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded-lg pointer-events-none shadow-lg"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 28 }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
}
