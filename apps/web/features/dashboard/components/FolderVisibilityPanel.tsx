'use client';

import { Archive } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import { DEFAULT_SCHEDULE } from '@/features/widgets/types/widgetDefaults';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface SchedulePickerProps {
    settings: WidgetSettings;
    patchSchedule: (patch: Partial<typeof DEFAULT_SCHEDULE>) => void;
}

function SchedulePicker({ settings, patchSchedule }: SchedulePickerProps) {
    function toggleDay(d: number) {
        const days = settings.schedule?.days ?? [];
        patchSchedule({
            days: days.includes(d)
                ? days.filter((x) => x !== d)
                : [...days, d].sort(),
        });
    }
    return (
        <div className="space-y-2 pl-0.5">
            <div className="flex gap-1.5">
                <div className="flex-1">
                    <p className="text-[9px] font-semibold text-zinc-400 mb-1">
                        From
                    </p>
                    <input
                        type="time"
                        value={
                            settings.schedule?.startTime ??
                            DEFAULT_SCHEDULE.startTime
                        }
                        onChange={(e) =>
                            patchSchedule({ startTime: e.target.value })
                        }
                        className="w-full text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-semibold text-zinc-400 mb-1">
                        To
                    </p>
                    <input
                        type="time"
                        value={
                            settings.schedule?.endTime ??
                            DEFAULT_SCHEDULE.endTime
                        }
                        onChange={(e) =>
                            patchSchedule({ endTime: e.target.value })
                        }
                        className="w-full text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                </div>
            </div>
            <div className="flex gap-0.5">
                {DAYS.map((day, i) => (
                    <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={cn(
                            'flex-1 h-6 rounded-md text-[9px] font-bold transition-all',
                            (settings.schedule?.days ?? []).includes(i)
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface FolderVisibilityPanelProps {
    settings: WidgetSettings;
    updateSettings: (patch: Partial<WidgetSettings>) => void;
    onBucket: (() => void) | null;
    onUnpresent: (() => void) | null;
    onClose: () => void;
}

export function FolderVisibilityPanel({
    settings,
    updateSettings,
    onBucket,
    onUnpresent,
    onClose,
}: FolderVisibilityPanelProps) {
    const scheduleEnabled = settings.schedule?.enabled ?? false;
    function patchSchedule(patch: Partial<typeof DEFAULT_SCHEDULE>) {
        updateSettings({
            schedule: { ...(settings.schedule ?? DEFAULT_SCHEDULE), ...patch },
        });
    }

    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-2.5">
            {(
                [
                    {
                        key: 'lowProfile',
                        label: 'Low profile',
                        patch: (v: boolean) => ({
                            lowProfile: v,
                            blur: false as const,
                            redact: false as const,
                        }),
                    },
                    {
                        key: 'blur',
                        label: 'Blur content',
                        patch: (v: boolean) => ({
                            blur: v,
                            redact: false as const,
                            lowProfile: false as const,
                        }),
                    },
                    {
                        key: 'redact',
                        label: 'Redact content',
                        patch: (v: boolean) => ({
                            redact: v,
                            blur: false as const,
                            lowProfile: false as const,
                        }),
                    },
                    {
                        key: 'autoHide',
                        label: 'Auto-hide',
                        patch: (v: boolean) => ({ autoHide: v }),
                    },
                ] as const
            ).map(({ key, label, patch }) => (
                <button
                    key={key}
                    onClick={() => updateSettings(patch(!settings[key]))}
                    className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <span>{label}</span>
                    <span
                        className={cn(
                            'w-7 h-4 rounded-full transition-colors shrink-0',
                            settings[key]
                                ? 'bg-zinc-900 dark:bg-zinc-100'
                                : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <span
                            className={cn(
                                'block w-3 h-3 rounded-full mt-0.5 transition-all',
                                settings[key]
                                    ? 'ml-3.5 bg-white dark:bg-zinc-900'
                                    : 'ml-0.5 bg-white dark:bg-zinc-400',
                            )}
                        />
                    </span>
                </button>
            ))}
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5 space-y-2">
                <button
                    onClick={() => {
                        const cur = settings.schedule ?? DEFAULT_SCHEDULE;
                        updateSettings({
                            schedule: { ...cur, enabled: !cur.enabled },
                        });
                    }}
                    className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <span>Schedule</span>
                    <span
                        className={cn(
                            'w-7 h-4 rounded-full transition-colors shrink-0',
                            scheduleEnabled
                                ? 'bg-zinc-900 dark:bg-zinc-100'
                                : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <span
                            className={cn(
                                'block w-3 h-3 rounded-full mt-0.5 transition-all',
                                scheduleEnabled
                                    ? 'ml-3.5 bg-white dark:bg-zinc-900'
                                    : 'ml-0.5 bg-white dark:bg-zinc-400',
                            )}
                        />
                    </span>
                </button>
                {scheduleEnabled && (
                    <SchedulePicker
                        settings={settings}
                        patchSchedule={patchSchedule}
                    />
                )}
            </div>
            {(onBucket || onUnpresent) && (
                <>
                    <div className="border-t border-gray-100 dark:border-zinc-800" />
                    {onBucket && (
                        <button
                            onClick={() => {
                                onBucket();
                                onClose();
                            }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <Archive size={11} /> Move to bucket
                        </button>
                    )}
                    {onUnpresent && (
                        <button
                            onClick={() => {
                                onUnpresent();
                                onClose();
                            }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                        >
                            <Archive size={11} className="opacity-60" /> Archive
                            to library
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
