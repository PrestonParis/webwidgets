'use client';

import { useState, useCallback } from 'react';

export interface ClockZone {
    label: string;
    tz: string;
    flag: string;
}

export const ALL_ZONES: ClockZone[] = [
    { label: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
    { label: 'Los Angeles', tz: 'America/Los_Angeles', flag: '🇺🇸' },
    { label: 'Chicago', tz: 'America/Chicago', flag: '🇺🇸' },
    { label: 'Toronto', tz: 'America/Toronto', flag: '🇨🇦' },
    { label: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
    { label: 'Mexico City', tz: 'America/Mexico_City', flag: '🇲🇽' },
    { label: 'London', tz: 'Europe/London', flag: '🇬🇧' },
    { label: 'Paris', tz: 'Europe/Paris', flag: '🇫🇷' },
    { label: 'Berlin', tz: 'Europe/Berlin', flag: '🇩🇪' },
    { label: 'Rome', tz: 'Europe/Rome', flag: '🇮🇹' },
    { label: 'Amsterdam', tz: 'Europe/Amsterdam', flag: '🇳🇱' },
    { label: 'Moscow', tz: 'Europe/Moscow', flag: '🇷🇺' },
    { label: 'Istanbul', tz: 'Europe/Istanbul', flag: '🇹🇷' },
    { label: 'Cairo', tz: 'Africa/Cairo', flag: '🇪🇬' },
    { label: 'Lagos', tz: 'Africa/Lagos', flag: '🇳🇬' },
    { label: 'Nairobi', tz: 'Africa/Nairobi', flag: '🇰🇪' },
    { label: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
    { label: 'Riyadh', tz: 'Asia/Riyadh', flag: '🇸🇦' },
    { label: 'Mumbai', tz: 'Asia/Kolkata', flag: '🇮🇳' },
    { label: 'Karachi', tz: 'Asia/Karachi', flag: '🇵🇰' },
    { label: 'Bangkok', tz: 'Asia/Bangkok', flag: '🇹🇭' },
    { label: 'Singapore', tz: 'Asia/Singapore', flag: '🇸🇬' },
    { label: 'Hong Kong', tz: 'Asia/Hong_Kong', flag: '🇭🇰' },
    { label: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
    { label: 'Seoul', tz: 'Asia/Seoul', flag: '🇰🇷' },
    { label: 'Shanghai', tz: 'Asia/Shanghai', flag: '🇨🇳' },
    { label: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
    { label: 'Melbourne', tz: 'Australia/Melbourne', flag: '🇦🇺' },
    { label: 'Auckland', tz: 'Pacific/Auckland', flag: '🇳🇿' },
];

const STORAGE_KEY = 'worldclock_zones';
const DEFAULT_TZS = [
    'America/New_York',
    'Europe/London',
    'Asia/Dubai',
    'Asia/Tokyo',
    'Australia/Sydney',
];

function loadZones(): string[] {
    if (typeof window === 'undefined') return DEFAULT_TZS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as unknown;
            if (
                Array.isArray(parsed) &&
                parsed.every((x) => typeof x === 'string')
            )
                return parsed;
        }
    } catch {
        /* ignore */
    }
    return DEFAULT_TZS;
}

export function useWorldClockZones() {
    const [activeTzs, setActiveTzs] = useState<string[]>(() => loadZones());

    const addZone = useCallback((tz: string) => {
        setActiveTzs((prev) => {
            if (prev.includes(tz)) return prev;
            const next = [...prev, tz];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const removeZone = useCallback((tz: string) => {
        setActiveTzs((prev) => {
            const next = prev.filter((t) => t !== tz);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const activeZones = ALL_ZONES.filter((z) => activeTzs.includes(z.tz));
    const availableZones = ALL_ZONES.filter((z) => !activeTzs.includes(z.tz));

    return { activeZones, availableZones, addZone, removeZone };
}
