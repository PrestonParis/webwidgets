'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';

interface ClockZone {
    label: string;
    tz: string;
    flag: string;
}

const ZONES: ClockZone[] = [
    { label: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
    { label: 'London', tz: 'Europe/London', flag: '🇬🇧' },
    { label: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
    { label: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
    { label: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
];

function formatTime(tz: string, now: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(now);
}

function getDayOffset(tz: string, now: Date): number {
    const localDay = now.getDay();
    const tzDay = new Date(
        now.toLocaleString('en-US', { timeZone: tz }),
    ).getDay();
    const diff = tzDay - localDay;
    if (diff > 1) return -1;
    if (diff < -1) return 1;
    return diff;
}

function localTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export default function WorldClockWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'worldclock',
        'worldclock',
    );
    const [now, setNow] = useState<Date>(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const userTz = localTz();

    return (
        <WidgetShell
            icon={<Globe size={16} />}
            title="World Clock"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="worldclock"
            widgetType="worldclock"
        >
            {/* Local time — large */}
            <div className="mb-4 pb-4 border-b border-stone-100 dark:border-zinc-800">
                <p className="text-xs text-stone-400 dark:text-zinc-600 mb-0.5">
                    Local
                </p>
                <p className="text-3xl font-bold tabular-nums text-stone-800 dark:text-zinc-100">
                    {now ? formatTime(userTz, now) : '--:-- --'}
                </p>
                <p className="text-xs text-stone-400 dark:text-zinc-600 mt-0.5">
                    {userTz.replace(/_/g, ' ')}
                </p>
            </div>

            {/* Other zones */}
            <ul className="space-y-3">
                {ZONES.filter((z) => z.tz !== userTz).map((zone) => {
                    const offset = now ? getDayOffset(zone.tz, now) : 0;
                    return (
                        <li
                            key={zone.tz}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-base"
                                    role="img"
                                    aria-label={zone.label}
                                >
                                    {zone.flag}
                                </span>
                                <span className="text-sm text-stone-600 dark:text-zinc-400">
                                    {zone.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {offset !== 0 && (
                                    <span
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                            offset > 0
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                        }`}
                                    >
                                        {offset > 0 ? '+1d' : '-1d'}
                                    </span>
                                )}
                                <span className="text-sm font-semibold tabular-nums text-stone-800 dark:text-zinc-200">
                                    {now
                                        ? formatTime(zone.tz, now)
                                        : '--:-- --'}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </WidgetShell>
    );
}
