'use client';

import { AnalogClockFace } from '@/features/worldclock/icons/AnalogClockFace';
import type { AnalogClockProps } from '@/types/worldclock';

function getTimeParts(
    tz: string,
    now: Date,
): { h: number; m: number; s: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(now);
    const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
    return { h: get('hour') % 12, m: get('minute'), s: get('second') };
}

export function AnalogClock({ tz, now, size = 80 }: AnalogClockProps) {
    const { h, m, s } = getTimeParts(tz, now);
    return <AnalogClockFace size={size} hour={h} minute={m} second={s} />;
}
