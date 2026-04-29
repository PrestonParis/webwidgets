'use client';

// ─────────────────────────────────────────────
// components/Recovery/RecoveryHeatmap.tsx
// A 52-week GitHub-style heatmap built from
// the relapses table. Days with a relapse are
// red, clean days are green, future days are empty.
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';

interface Props {
    trackerId: string;
    startTime: string;
}

interface Relapse {
    relapsed_at: string;
}

const WEEKS = 26; // ~6 months visible in compact space
const DAYS = WEEKS * 7;

function toDateKey(date: Date) {
    return date.toISOString().split('T')[0];
}

export default function RecoveryHeatmap({ trackerId, startTime }: Props) {
    const [relapseDays, setRelapseDays] = useState<Set<string>>(new Set());
    const [tooltip, setTooltip] = useState<{
        text: string;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        if (!trackerId) return;
        supabase
            .from('relapses')
            .select('relapsed_at')
            .eq('tracker_id', trackerId)
            .then(({ data }) => {
                if (!data) return;
                setRelapseDays(
                    new Set(
                        (data as Relapse[]).map((r) =>
                            toDateKey(new Date(r.relapsed_at)),
                        ),
                    ),
                );
            });
    }, [trackerId]);

    // Build day grid: DAYS cells ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startTime);
    startDate.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    // Pad so week starts on Sunday
    const firstDayOfWeek = days[0].getDay(); // 0=Sun
    const padded: (Date | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...days,
    ];

    // Chunk into weeks (columns)
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    const cellColor = (day: Date | null) => {
        if (!day) return 'transparent';
        const key = toDateKey(day);
        const isFuture = day > today;
        const isBeforeStart = day < startDate;

        if (isFuture || isBeforeStart) return '#e5e7eb'; // gray-200 / out of range
        if (relapseDays.has(key)) return '#fca5a5'; // red-300
        return '#86efac'; // green-300 — clean day
    };

    const CELL = 10;
    const GAP = 2;
    const stride = CELL + GAP;

    return (
        <div className="relative">
            {/* Day-of-week labels */}
            <div className="flex gap-0.5 mb-1 pl-0">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span
                        key={i}
                        className="text-[8px] text-gray-300 dark:text-zinc-600 font-bold"
                        style={{ width: CELL, textAlign: 'center' }}
                    >
                        {i % 2 === 0 ? d : ''}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((day, di) => {
                            const bg = cellColor(day);
                            return (
                                <div
                                    key={di}
                                    style={{
                                        width: CELL,
                                        height: CELL,
                                        borderRadius: 2,
                                        background: bg,
                                        cursor: day ? 'pointer' : 'default',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!day) return;
                                        const key = toDateKey(day);
                                        const relapsed = relapseDays.has(key);
                                        setTooltip({
                                            text: `${day.toLocaleDateString()} — ${relapsed ? 'relapsed' : 'clean'}`,
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-xs bg-green-300" />
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500">
                        Clean
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-xs bg-red-300" />
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500">
                        Relapse
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-xs bg-gray-200 dark:bg-zinc-700" />
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500">
                        Before start
                    </span>
                </div>
            </div>

            {/* Tooltip */}
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
