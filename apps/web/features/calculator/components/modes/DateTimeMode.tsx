'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/utils';
import type { CalcControls } from '../../hooks/useCalculator';

type DateTab = 'diff' | 'add' | 'subtract';

interface DateTimeModeProps {
    calc: CalcControls;
}

interface DurationParts {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    totalDays: number;
}

function dateDiff(d1: string, d2: string): DurationParts | null {
    if (!d1 || !d2) return null;
    const a = new Date(d1);
    const b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    const [earlier, later] = a <= b ? [a, b] : [b, a];

    const totalDays = Math.round(
        (later.getTime() - earlier.getTime()) / 86400000,
    );

    let years = later.getFullYear() - earlier.getFullYear();
    let months = later.getMonth() - earlier.getMonth();
    let days = later.getDate() - earlier.getDate();

    if (days < 0) {
        months--;
        days += new Date(later.getFullYear(), later.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const hours = Math.floor(totalDays * 24);
    const minutes = totalDays * 24 * 60;

    return { years, months, days, hours, minutes, totalDays };
}

function addDuration(
    baseDate: string,
    years: string,
    months: string,
    days: string,
    hours: string,
    minutes: string,
    subtract = false,
): string | null {
    if (!baseDate) return null;
    const d = new Date(baseDate);
    if (isNaN(d.getTime())) return null;
    const sign = subtract ? -1 : 1;

    d.setFullYear(d.getFullYear() + sign * (parseInt(years) || 0));
    d.setMonth(d.getMonth() + sign * (parseInt(months) || 0));
    d.setDate(d.getDate() + sign * (parseInt(days) || 0));
    d.setHours(d.getHours() + sign * (parseInt(hours) || 0));
    d.setMinutes(d.getMinutes() + sign * (parseInt(minutes) || 0));

    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function DateTimeMode({ calc }: DateTimeModeProps) {
    const [tab, setTab] = useState<DateTab>('diff');
    const dt = calc.dateTimeInputs;
    const set = calc.updateDateTimeInputs;

    const diffResult = useMemo(
        () => dateDiff(dt.date1, dt.date2),
        [dt.date1, dt.date2],
    );

    const addResult = useMemo(
        () =>
            addDuration(
                dt.addDate,
                dt.years,
                dt.months,
                dt.days,
                dt.hours,
                dt.minutes,
                tab === 'subtract',
            ),
        [dt.addDate, dt.years, dt.months, dt.days, dt.hours, dt.minutes, tab],
    );

    const today = new Date().toISOString().split('T')[0]!;

    const TABS: { id: DateTab; label: string }[] = [
        { id: 'diff', label: 'Date Difference' },
        { id: 'add', label: 'Add Duration' },
        { id: 'subtract', label: 'Subtract Duration' },
    ];

    return (
        <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                            tab === t.id
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'diff' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <DateField
                            label="Start date"
                            value={dt.date1}
                            onChange={(v) => set({ date1: v })}
                        />
                        <DateField
                            label="End date"
                            value={dt.date2}
                            onChange={(v) => set({ date2: v })}
                            today={today}
                        />
                    </div>
                    {diffResult && (
                        <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <StatRow
                                    label="Total days"
                                    value={diffResult.totalDays.toLocaleString()}
                                />
                                <StatRow
                                    label="Total hours"
                                    value={diffResult.hours.toLocaleString()}
                                />
                                <StatRow
                                    label="Total minutes"
                                    value={Math.round(
                                        diffResult.minutes,
                                    ).toLocaleString()}
                                />
                                <StatRow
                                    label="Total weeks"
                                    value={(diffResult.totalDays / 7).toFixed(
                                        1,
                                    )}
                                />
                            </div>
                            <div className="mt-3 pt-3 border-t border-zinc-800">
                                <p className="text-xs text-zinc-400 text-center">
                                    {diffResult.years > 0 &&
                                        `${diffResult.years}y `}
                                    {diffResult.months > 0 &&
                                        `${diffResult.months}mo `}
                                    {diffResult.days > 0 &&
                                        `${diffResult.days}d`}
                                    {!diffResult.years &&
                                        !diffResult.months &&
                                        !diffResult.days &&
                                        '0 days'}
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    calc.pushExpr(
                                        diffResult.totalDays.toString(),
                                    )
                                }
                                className="mt-2 w-full py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
                            >
                                Use total days in calculator
                            </button>
                        </div>
                    )}
                </div>
            )}

            {(tab === 'add' || tab === 'subtract') && (
                <div className="space-y-3">
                    <DateField
                        label={`${tab === 'add' ? 'Add to' : 'Subtract from'} this date`}
                        value={dt.addDate}
                        onChange={(v) => set({ addDate: v })}
                        today={today}
                    />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Duration
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Years', field: 'years' as const },
                            { label: 'Months', field: 'months' as const },
                            { label: 'Days', field: 'days' as const },
                            { label: 'Hours', field: 'hours' as const },
                            { label: 'Minutes', field: 'minutes' as const },
                        ].map(({ label, field }) => (
                            <label key={field} className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                    {label}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={dt[field]}
                                    onChange={(e) =>
                                        set({ [field]: e.target.value })
                                    }
                                    className="h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 outline-none tabular-nums"
                                />
                            </label>
                        ))}
                    </div>
                    {addResult && (
                        <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-4">
                            <p className="text-xs text-zinc-400 text-center mb-1">
                                Result
                            </p>
                            <p className="text-sm font-semibold text-white text-center">
                                {addResult}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DateField({
    label,
    value,
    onChange,
    today,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    today?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    {label}
                </span>
                {today && (
                    <button
                        onClick={() => onChange(today)}
                        className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors"
                    >
                        Today
                    </button>
                )}
            </div>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 outline-none"
            />
        </label>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="font-bold tabular-nums text-white">{value}</span>
        </div>
    );
}
