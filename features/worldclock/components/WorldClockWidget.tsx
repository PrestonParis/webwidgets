'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, X } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
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
        hour12: true,
    }).format(now);
}

function formatMilitary(tz: string, now: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
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

function localTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const MODES: Array<{ id: ClockMode; label: string }> = [
    { id: 'digital', label: 'Digital' },
    { id: 'military', label: '24h' },
    { id: 'analog', label: 'Analog' },
];

export default function WorldClockWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'worldclock',
        'worldclock',
    );
    const [now, setNow] = useState<Date>(new Date());
    const [addOpen, setAddOpen] = useState(false);
    const { activeZones, availableZones, addZone, removeZone } =
        useWorldClockZones();
    const { mode, setMode } = useClockMode();

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const userTz = localTz();
    const visibleZones = activeZones.filter((z) => z.tz !== userTz);

    return (
        <WidgetShell
            icon={<Globe size={16} />}
            title="World Clock"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="worldclock"
            widgetType="worldclock"
            footerHref="/worldclock"
            footerLabel="World clock →"
        >
            {/* Mode selector */}
            <div className="flex gap-0.5 mb-4 bg-stone-100 dark:bg-zinc-800/80 rounded-lg p-0.5">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-all ${
                            mode === m.id
                                ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300'
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Local time */}
            <div className="mb-4 pb-4 border-b border-stone-100 dark:border-zinc-800">
                <p className="text-xs text-stone-400 dark:text-zinc-600 mb-0.5">
                    Local
                </p>
                {mode === 'analog' ? (
                    <div className="flex justify-center py-1">
                        <AnalogClock tz={userTz} now={now} size={100} />
                    </div>
                ) : (
                    <p className="text-3xl font-bold tabular-nums text-stone-800 dark:text-zinc-100">
                        {formatTime(mode, userTz, now)}
                    </p>
                )}
                <p className="text-xs text-stone-400 dark:text-zinc-600 mt-0.5">
                    {userTz.replace(/_/g, ' ')}
                </p>
            </div>

            {/* Zone list */}
            <ul className="space-y-2.5">
                {visibleZones.map((zone) => {
                    const offset = getDayOffset(zone.tz, now);
                    return (
                        <li
                            key={zone.tz}
                            className="flex items-center justify-between group"
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
                                {mode === 'analog' ? (
                                    <AnalogClock
                                        tz={zone.tz}
                                        now={now}
                                        size={48}
                                    />
                                ) : (
                                    <span className="text-sm font-semibold tabular-nums text-stone-800 dark:text-zinc-200">
                                        {formatTime(mode, zone.tz, now)}
                                    </span>
                                )}
                                <button
                                    onClick={() => removeZone(zone.tz)}
                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
                                    aria-label={`Remove ${zone.label}`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Add zone */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
                {addOpen ? (
                    <div className="flex items-center gap-2">
                        <select
                            className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-stone-700 dark:text-zinc-300"
                            defaultValue=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    addZone(e.target.value);
                                    setAddOpen(false);
                                }
                            }}
                        >
                            <option value="" disabled>
                                Select a city…
                            </option>
                            {availableZones.map((z) => (
                                <option key={z.tz} value={z.tz}>
                                    {z.flag} {z.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setAddOpen(false)}
                            className="text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddOpen(true)}
                        disabled={availableZones.length === 0}
                        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Plus size={13} />
                        Add city
                    </button>
                )}
            </div>
        </WidgetShell>
    );
}
