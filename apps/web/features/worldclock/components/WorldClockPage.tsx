'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, X } from 'lucide-react';
import { useWorldClockZones } from '@/features/worldclock/hooks/useWorldClockZones';
import {
    useClockMode,
    type ClockMode,
} from '@/features/worldclock/hooks/useClockMode';
import { AnalogClock } from '@/features/worldclock/components/AnalogClock';

function formatDigital(tz: string, now: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).format(now);
}

function formatMilitary(tz: string, now: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(now);
}

function formatTime(mode: ClockMode, tz: string, now: Date): string {
    return mode === 'military'
        ? formatMilitary(tz, now)
        : formatDigital(tz, now);
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

const MODES: Array<{ id: ClockMode; label: string }> = [
    { id: 'digital', label: 'Digital' },
    { id: 'military', label: '24h' },
    { id: 'analog', label: 'Analog' },
];

export function WorldClockPage({ embedded = false }: { embedded?: boolean }) {
    const [now, setNow] = useState<Date>(new Date());
    const [addOpen, setAddOpen] = useState(false);
    const { activeZones, availableZones, addZone, removeZone } =
        useWorldClockZones();
    const { mode, setMode } = useClockMode();

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const allZones = [
        { label: 'Local', tz: userTz, flag: '📍' },
        ...activeZones.filter((z) => z.tz !== userTz),
    ];

    const content = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Globe size={22} className="text-indigo-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                            World Clock
                        </h1>
                        <p className="text-sm text-stone-500 dark:text-zinc-500">
                            {allZones.length} cities
                        </p>
                    </div>
                </div>

                {/* Mode selector */}
                <div className="flex gap-0.5 bg-stone-100 dark:bg-zinc-800 rounded-xl p-1">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                mode === m.id
                                    ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clock grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                {allZones.map((zone) => {
                    const offset =
                        zone.tz !== userTz ? getDayOffset(zone.tz, now) : 0;
                    return (
                        <div
                            key={zone.tz}
                            className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 p-4 flex flex-col items-center gap-2"
                        >
                            {zone.tz !== userTz && (
                                <button
                                    onClick={() => removeZone(zone.tz)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
                                    aria-label={`Remove ${zone.label}`}
                                >
                                    <X size={13} />
                                </button>
                            )}
                            <span
                                className="text-2xl"
                                role="img"
                                aria-label={zone.label}
                            >
                                {zone.flag}
                            </span>
                            <p className="text-xs font-medium text-stone-600 dark:text-zinc-400 text-center">
                                {zone.label}
                            </p>
                            {mode === 'analog' ? (
                                <AnalogClock tz={zone.tz} now={now} size={80} />
                            ) : (
                                <p className="text-lg font-bold tabular-nums text-stone-800 dark:text-zinc-100 text-center">
                                    {formatTime(mode, zone.tz, now)}
                                </p>
                            )}
                            {offset !== 0 && (
                                <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                        offset > 0
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                    }`}
                                >
                                    {offset > 0 ? '+1 day' : '−1 day'}
                                </span>
                            )}
                            <p className="text-[10px] text-stone-400 dark:text-zinc-600 text-center truncate w-full">
                                {zone.tz.replace(/_/g, ' ')}
                            </p>
                        </div>
                    );
                })}

                {/* Add city card */}
                {availableZones.length > 0 && (
                    <div className="bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-700 p-4 flex flex-col items-center justify-center gap-2 min-h-[160px]">
                        {addOpen ? (
                            <div className="w-full space-y-2">
                                <select
                                    className="w-full text-xs rounded-lg border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-stone-700 dark:text-zinc-300"
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addZone(e.target.value);
                                            setAddOpen(false);
                                        }
                                    }}
                                >
                                    <option value="" disabled>
                                        Select city…
                                    </option>
                                    {availableZones.map((z) => (
                                        <option key={z.tz} value={z.tz}>
                                            {z.flag} {z.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setAddOpen(false)}
                                    className="w-full text-xs text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddOpen(true)}
                                className="flex flex-col items-center gap-1.5 text-stone-400 hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Plus size={20} />
                                <span className="text-xs font-medium">
                                    Add city
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    if (embedded) return <div className="w-full">{content}</div>;

    return (
        <main className="max-w-5xl mx-auto px-6 py-8 lg:px-12">{content}</main>
    );
}
