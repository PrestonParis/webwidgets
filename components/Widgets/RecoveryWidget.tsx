'use client';

import { supabase } from '@/app/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTimeParts } from '@/app/lib/utils/time';
import { SoberWidgetProps } from '@/types/recovery';
import { RecoveryView } from '@/types/widgets';
import TimeUnit from '@/components/Recovery/TimeUnit';
import RecoveryHeatmap from '@/components/Recovery/RecoveryHeatmap';
import WidgetShell from '@/components/Widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { cn } from '@/app/lib/utils';
import { HeartIcon } from '@/components/Icons/HeartIcon';

const VIEW_OPTIONS: { value: RecoveryView; label: string }[] = [
    { value: 'timer', label: 'Timer' },
    { value: 'heatmap', label: 'Heatmap' },
];

export default function SoberWidget({ tracker, onReset }: SoberWidgetProps) {
    const [secondsClean, setSecondsClean] = useState(0);
    const [trigger, setTrigger] = useState('');
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { settings, updateSettings } = useWidgetSettings(
        tracker.id,
        'recovery',
    );
    const view = (settings.view as RecoveryView) ?? 'timer';

    const startTime = tracker.start_time;
    const addiction = tracker.addiction;
    const time = getTimeParts(secondsClean);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();
        const interval = setInterval(() => {
            setSecondsClean(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const handleLogUrge = async () => {
        if (!trigger.trim()) return;
        setIsSaving(true);
        await supabase
            .from('urges')
            .insert({ trigger, intensity: 5, tracker_id: tracker.id });
        setTrigger('');
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const handleReset = async () => {
        const confirmed = window.confirm('Reset your streak?');
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase
            .from('relapses')
            .insert({ relapsed_at: now, tracker_id: tracker.id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: now })
            .eq('id', tracker.id);
        onReset(tracker.id, now);
        setSecondsClean(0);
    };

    // ── Settings slot: view toggle ───────────────
    const settingsSlot = (
        <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                View
            </p>
            <div className="flex gap-2">
                {VIEW_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => updateSettings({ view: opt.value })}
                        className={cn(
                            'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all',
                            view === opt.value
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    // ── Footer slot ──────────────────────────────
    const footerSlot = showUrgeForm ? (
        <div className="space-y-2">
            <textarea
                placeholder="What triggered it?"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-16"
            />
            <div className="flex gap-2">
                <button
                    onClick={handleLogUrge}
                    disabled={isSaving || !trigger.trim()}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={() => {
                        setShowUrgeForm(false);
                        setTrigger('');
                    }}
                    className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    ) : (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <button
                    onClick={() => setShowUrgeForm(true)}
                    className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                    Log urge
                </button>
                <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    Reset Streak
                </button>
            </div>
            <Link
                href="/recovery"
                className="block text-center text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors pt-1"
            >
                View full page →
            </Link>
        </div>
    );

    // ── No start time ────────────────────────────
    if (!startTime) {
        return (
            <WidgetShell
                icon={<HeartIcon />}
                title="Sober Time"
                settings={settings}
                onSettingsChange={updateSettings}
                settingsSlot={settingsSlot}
                footerHref="/recovery"
                footerLabel="View full page →"
            >
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                    No streak started. Visit the recovery page to begin.
                </p>
            </WidgetShell>
        );
    }

    return (
        <WidgetShell
            icon={<HeartIcon />}
            title="Sober Time"
            badge={addiction || undefined}
            settings={settings}
            onSettingsChange={updateSettings}
            settingsSlot={settingsSlot}
            footerSlot={footerSlot}
        >
            {view === 'timer' ? (
                <div className="flex flex-wrap gap-3 items-end">
                    {time.years > 0 && (
                        <TimeUnit value={time.years} label="y" />
                    )}
                    {time.months > 0 && (
                        <TimeUnit value={time.months} label="m" />
                    )}
                    <TimeUnit value={time.days} label="d" />
                    <TimeUnit value={time.hours} label="h" />
                    <TimeUnit value={time.minutes} label="m" />
                    <div className="flex flex-col items-center animate-pulse">
                        <span className="text-xl font-black text-emerald-500">
                            {time.seconds}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                            s
                        </span>
                    </div>
                </div>
            ) : (
                <RecoveryHeatmap trackerId={tracker.id} startTime={startTime} />
            )}
        </WidgetShell>
    );
}
