'use client';

import { useState } from 'react';
import type {
    Habit,
    HabitFrequency,
    RepeatConfig,
} from '@/features/habit/types/habit';
import { cn } from '@/lib/utils/utils';

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
];

interface HabitImportPanelProps {
    importHabits: (names: string[]) => Promise<Habit[]>;
    setRepeatConfig: (
        id: string,
        config: Partial<RepeatConfig> & { frequency: HabitFrequency },
    ) => void;
    onDone: () => void;
}

function parseImportText(text: string): string[] {
    return text
        .split(/\r?\n|,/)
        .map((part) => part.replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
}

export function HabitImportPanel({
    importHabits,
    setRepeatConfig,
    onDone,
}: HabitImportPanelProps) {
    const [importRows, setImportRows] = useState<string[]>(['']);
    const [importFreq, setImportFreq] = useState<HabitFrequency>('daily');

    const importNames = importRows.map((row) => row.trim()).filter(Boolean);

    async function handleImportFile(file: File | null) {
        if (!file) return;
        const names = parseImportText(await file.text());
        if (names.length === 0) return;
        setImportRows((rows) => [
            ...rows.filter((r) => r.trim()),
            ...names,
            '',
        ]);
    }

    return (
        <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                Import Events
            </p>
            <div className="space-y-1.5">
                {importRows.map((row, index) => (
                    <div key={index} className="flex gap-1.5">
                        <input
                            value={row}
                            onChange={(e) =>
                                setImportRows((rows) =>
                                    rows.map((r, i) =>
                                        i === index ? e.target.value : r,
                                    ),
                                )
                            }
                            placeholder={
                                index === 0 ? 'Morning walk' : 'Event name'
                            }
                            className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        />
                        {importRows.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setImportRows((rows) =>
                                        rows.filter((_, i) => i !== index),
                                    )
                                }
                                className="rounded-lg px-2 text-xs text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                aria-label="Remove event row"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => setImportRows((rows) => [...rows, ''])}
                    className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                    + Add event row
                </button>
                <label className="cursor-pointer rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400">
                    Parse from file
                    <input
                        type="file"
                        accept=".txt,.csv,.tsv,.md,text/plain,text/csv"
                        className="sr-only"
                        onChange={(e) => {
                            void handleImportFile(e.target.files?.[0] ?? null);
                            e.currentTarget.value = '';
                        }}
                    />
                </label>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                    Schedule:
                </span>
                <div className="flex gap-1">
                    {FREQ_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setImportFreq(opt.value)}
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                importFreq === opt.value
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="button"
                disabled={importNames.length === 0}
                onClick={() => {
                    void (async () => {
                        const created = await importHabits(importNames);
                        for (const habit of created) {
                            setRepeatConfig(habit.id, {
                                frequency: importFreq,
                            });
                        }
                        setImportRows(['']);
                        onDone();
                    })();
                }}
                className="w-full rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-medium py-1.5 transition-colors"
            >
                Import {importNames.length || ''} events
            </button>
        </div>
    );
}
