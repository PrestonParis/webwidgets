'use client';

import { useEffect, useState } from 'react';
import type { VisibilitySchedule } from '@/features/widgets/types/widgets';

function nowMinutes(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
}

function parseTime(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

function isScheduleActive(schedule: VisibilitySchedule | undefined): boolean {
    if (!schedule?.enabled) return true;

    const now = new Date();
    const day = now.getDay(); // 0=Sun…6=Sat

    if (schedule.days.length > 0 && !schedule.days.includes(day)) return false;

    const current = nowMinutes();
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start <= end) {
        return current >= start && current <= end;
    }
    // Overnight window (e.g. 22:00–06:00)
    return current >= start || current <= end;
}

export function useScheduledVisibility(
    schedule: VisibilitySchedule | undefined,
): boolean {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!schedule?.enabled) return;

        const id = setInterval(() => {
            setTick((value) => value + 1);
        }, 60_000);

        return () => clearInterval(id);
    }, [schedule?.enabled]);

    void tick;
    return isScheduleActive(schedule);
}
