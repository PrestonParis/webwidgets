'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useMoodLog } from '@/features/mood/hooks/useMoodLog';
import { MOODS, DOT_COLORS } from '@/features/mood/constants';
import { useMoodHistory } from '@/features/mood/hooks/useMoodHistory';
import LoadingState from '@/features/ui/components/LoadingState';
import { MoodEntry } from '@/features/mood/types/mood';

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

function EditingHeader({
    label,
    onBack,
}: {
    label: string;
    onBack: () => void;
}) {
    return (
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                {label}
            </span>
            <button
                onClick={onBack}
                className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
            >
                ✕ Back to today
            </button>
        </div>
    );
}

function MoodHistory({
    editingDate,
    last7,
    today,
    onSelect,
}: {
    editingDate: string | null;
    last7: ReturnType<typeof useMoodHistory>['last7'];
    today: string;
    onSelect: (date: string | null) => void;
}) {
    return (
        <div className="mt-auto pt-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-600 mb-2">
                Last 7 Days
            </p>
            <div className="flex gap-1.5 items-end">
                {last7.map(({ date, entry }) => (
                    <MoodHistoryDay
                        key={date}
                        date={date}
                        editingDate={editingDate}
                        entry={entry}
                        today={today}
                        onSelect={onSelect}
                    />
                ))}
            </div>
            {!editingDate && (
                <p className="text-[9px] text-stone-300 dark:text-zinc-700 mt-1.5 text-center">
                    Tap a day to log past mood
                </p>
            )}
        </div>
    );
}

function MoodHistoryDay({
    date,
    editingDate,
    entry,
    today,
    onSelect,
}: {
    date: string;
    editingDate: string | null;
    entry: MoodEntry | undefined;
    today: string;
    onSelect: (date: string | null) => void;
}) {
    const isSelected = editingDate === date;
    const isToday = date === today;
    return (
        <button
            onClick={() => onSelect(isSelected ? null : date)}
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
                className={`text-[8px] font-bold transition-colors ${dayTextClass(isSelected, isToday)}`}
            >
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'narrow',
                })}
            </span>
        </button>
    );
}

function dayTextClass(isSelected: boolean, isToday: boolean): string {
    if (isSelected) return 'text-stone-500 dark:text-zinc-400';
    return isToday
        ? 'text-stone-400 dark:text-zinc-500'
        : 'text-stone-300 dark:text-zinc-700';
}

export default function MoodWidget() {
    const { settings, updateSettings } = useWidgetSettings('mood', 'mood');
    const { entries, loading, logMood } = useMoodLog();
    const { last7, today } = useMoodHistory(entries);
    const todayEntry = entries.find((e) => e.logged_date === today);
    const [editingDate, setEditingDate] = useState<string | null>(null);

    if (loading) return <LoadingState />;

    const editingEntry = editingDate
        ? entries.find((e) => e.logged_date === editingDate)
        : undefined;

    const activeDateLabel = editingDate
        ? dayLabel(editingDate, today)
        : todayEntry
          ? 'Today you felt:'
          : 'How are you feeling today?';

    return (
        <WidgetShell
            icon={<Smile size={16} />}
            title="Mood"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="mood"
            widgetType="mood"
            footerHref="/mood"
            footerLabel="Mood log →"
        >
            <div className="flex flex-col h-full">
                {editingDate && editingDate !== today && (
                    <EditingHeader
                        label={activeDateLabel}
                        onBack={() => setEditingDate(null)}
                    />
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
                <MoodHistory
                    editingDate={editingDate}
                    last7={last7}
                    today={today}
                    onSelect={setEditingDate}
                />
            </div>
        </WidgetShell>
    );
}
