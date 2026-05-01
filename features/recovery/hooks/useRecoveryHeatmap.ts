'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { toDateKey } from '@/features/recovery/lib/relapses';

const WEEKS = 26;
const DAYS = WEEKS * 7;
export const CELL = 10;

interface Relapse {
    relapsed_at: string;
}

function buildWeeks(): (Date | null)[][] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    const padded: (Date | null)[] = [
        ...Array(days[0].getDay()).fill(null),
        ...days,
    ];

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    return weeks;
}

export function cellColor(
    day: Date | null,
    startTime: string,
    relapseDays: Set<string>,
): string {
    if (!day) return 'transparent';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startTime);
    startDate.setHours(0, 0, 0, 0);

    if (day > today || day < startDate) return '#e5e7eb';
    if (relapseDays.has(toDateKey(day))) return '#fca5a5';
    return '#86efac';
}

export function useRecoveryHeatmap(trackerId: string) {
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

    const weeks = buildWeeks();

    return { relapseDays, weeks, tooltip, setTooltip };
}
