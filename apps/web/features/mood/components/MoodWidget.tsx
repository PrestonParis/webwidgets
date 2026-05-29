'use client';

import { useCallback, useState } from 'react';
import { Smile } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';
import { useMoodMutation } from '@/features/mood/hooks/useMoodMutation';
import { useMoodHistory } from '@/features/mood/hooks/useMoodHistory';
import { MOODS, DOT_COLORS } from '@/features/mood/constants';
import LoadingState from '@/features/ui/components/LoadingState';
import type { MoodEntry } from '@/features/mood/types/mood';
import { useQueryClient } from '@tanstack/react-query';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';

// ── Optimistic local override: tracks entries logged this session ─────────────
// When the user logs a mood, we update local state immediately rather than waiting
// for TanStack Query to refetch. On next query refresh the adapter data wins.

function MoodPicker({
    currentEntry,
    label,
    onPick,
}: {
    currentEntry: MoodEntry | undefined;
    label: string;
    onPick: (value: number) => void;
}) {
    return (
        <div>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mb-3">
                {label}
            </p>
            <div className="flex gap-2">
                {MOODS.map((m) => (
                    <button
                        key={m.value}
                        onClick={() => onPick(m.value)}
                        title={m.label}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
                            currentEntry?.score === m.value
                                ? `${m.color} border-current scale-105`
                                : 'border-transparent hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[9px] text-stone-400 dark:text-zinc-600 font-medium">
                            {m.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function dayLabel(dateStr: string, today: string): string {
    if (dateStr === today) return 'Today';
    const d = new Date(dateStr + 'T12:00:00');
    const daysAgo = Math.round(
        (new Date(today + 'T12:00:00').getTime() - d.getTime()) / 86_400_000,
    );
    if (daysAgo === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export default function MoodWidget({
    widgetId = 'mood',
}: {
    widgetId?: string;
}) {
    const { settings, updateSettings } = useWidgetSettings(widgetId, 'mood');
    const { payload, loading } = useWidgetData(widgetId, 'mood');
    const queryClient = useQueryClient();

    // Local optimistic overrides: entries logged this session before re-fetch
    const [optimisticEntries, setOptimisticEntries] = useState<MoodEntry[]>([]);

    const handleMoodLogged = useCallback(
        (entry: MoodEntry) => {
            setOptimisticEntries((prev) => [
                entry,
                ...prev.filter((e) => e.logged_date !== entry.logged_date),
            ]);
            // Invalidate the query so next focus/interval picks up fresh data
            void queryClient.invalidateQueries({
                queryKey: ['widget-adapter', 'mood_logs', 'current_user'],
            });
        },
        [queryClient],
    );

    const { logMood } = useMoodMutation(handleMoodLogged);

    // Merge adapter entries with optimistic overrides (optimistic wins for same date)
    const adapterRows =
        (payload?.sources['mood_logs']?.data as Array<{
            id: string;
            mood: number;
            note: string;
            logged_date: string;
            logged_at: string;
        }> | null) ?? [];

    const adapterEntries: MoodEntry[] = adapterRows.map((r) => ({
        id: r.id,
        user_id: '',
        mood: r.mood,
        score: r.mood,
        note: r.note ?? null,
        logged_date: r.logged_date,
        logged_at: r.logged_at,
    }));

    // Optimistic entries override adapter entries for the same date
    const optimisticDates = new Set(
        optimisticEntries.map((e) => e.logged_date),
    );
    const mergedEntries: MoodEntry[] = [
        ...optimisticEntries,
        ...adapterEntries.filter((e) => !optimisticDates.has(e.logged_date)),
    ].sort((a, b) => b.logged_date.localeCompare(a.logged_date));

    const { last7, today } = useMoodHistory(mergedEntries);
    const todayEntry = mergedEntries.find((e) => e.logged_date === today);
    const [editingDate, setEditingDate] = useState<string | null>(null);

    if (loading) return <LoadingState />;

    const editingEntry = editingDate
        ? mergedEntries.find((e) => e.logged_date === editingDate)
        : undefined;

    return (
        <WidgetShell
            icon={<Smile size={16} />}
            title="Mood"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId={widgetId}
            widgetType="mood"
            footerHref="/mood"
            footerLabel="Mood log →"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="mood_logs"
                    displayName="Mood"
                />
            }
        >
            <div className="flex flex-col h-full">
                {editingDate && editingDate !== today && (
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                            {dayLabel(editingDate, today)}
                        </span>
                        <button
                            onClick={() => setEditingDate(null)}
                            className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            ✕ Back to today
                        </button>
                    </div>
                )}

                <MoodPicker
                    currentEntry={editingDate ? editingEntry : todayEntry}
                    label={
                        editingDate && editingDate !== today
                            ? ''
                            : todayEntry
                              ? 'Today you felt:'
                              : 'How are you feeling today?'
                    }
                    onPick={(value) => {
                        void logMood(value, editingDate ?? undefined).then(
                            () => {
                                if (editingDate && editingDate !== today)
                                    setEditingDate(null);
                            },
                        );
                    }}
                />

                {/* History bar */}
                <div className="mt-auto pt-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-600 mb-2">
                        Last 7 Days
                    </p>
                    <div className="flex gap-1.5 items-end">
                        {last7.map(({ date, entry }) => {
                            const isSelected = editingDate === date;
                            const isToday = date === today;
                            return (
                                <button
                                    key={date}
                                    onClick={() =>
                                        setEditingDate(isSelected ? null : date)
                                    }
                                    title={
                                        entry
                                            ? `${dayLabel(date, today)}: ${MOODS.find((m) => m.value === entry.score)?.label ?? ''}`
                                            : `Log mood for ${dayLabel(date, today)}`
                                    }
                                    className={`flex-1 flex flex-col items-center gap-1 rounded transition-all ${
                                        isSelected
                                            ? 'ring-1 ring-offset-1 ring-stone-400 dark:ring-zinc-500 rounded'
                                            : ''
                                    }`}
                                >
                                    <div
                                        className={`w-full rounded-full transition-all ${
                                            entry
                                                ? `${DOT_COLORS[entry.score]} ${isSelected ? 'h-4' : 'h-3'}`
                                                : `${isSelected ? 'bg-stone-300 dark:bg-zinc-600' : 'bg-stone-100 dark:bg-zinc-800'} h-3 hover:bg-stone-200 dark:hover:bg-zinc-700`
                                        }`}
                                    />
                                    <span
                                        className={`text-[8px] font-bold transition-colors ${
                                            isSelected
                                                ? 'text-stone-500 dark:text-zinc-400'
                                                : isToday
                                                  ? 'text-stone-400 dark:text-zinc-500'
                                                  : 'text-stone-300 dark:text-zinc-700'
                                        }`}
                                    >
                                        {new Date(
                                            date + 'T12:00:00',
                                        ).toLocaleDateString('en-US', {
                                            weekday: 'narrow',
                                        })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {!editingDate && (
                        <p className="text-[9px] text-stone-300 dark:text-zinc-700 mt-1.5 text-center">
                            Tap a day to log past mood
                        </p>
                    )}
                </div>
            </div>
        </WidgetShell>
    );
}
