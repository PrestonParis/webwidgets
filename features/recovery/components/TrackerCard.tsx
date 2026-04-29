import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/types/recovery';
import { formatTime } from '@/lib/utils/time';
import DatePicker from './datepicker/DatePicker';
import CalendarView from './CalendarView';

export default function TrackerCard({
    tracker,
    onReset,
    onUpdateStart,
}: {
    tracker: Tracker;
    onReset: (id: string) => void;
    onUpdateStart: (id: string, newStart: string) => void;
}) {
    const [secondsClean, setSecondsClean] = useState(0);
    const [editingStart, setEditingStart] = useState(false);
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [trigger, setTrigger] = useState('');
    const [intensity, setIntensity] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [relapses, setRelapses] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);

    type RelapseRow = {
        relapsed_at: string;
    };
    useEffect(() => {
        supabase
            .from('relapses')
            .select('relapsed_at')
            .eq('tracker_id', tracker.id)
            .then(({ data }) =>
                setRelapses(
                    ((data as RelapseRow[]) || []).map(
                        (r) => r.relapsed_at.split('T')[0],
                    ),
                ),
            );
    }, [tracker.id]);

    // TODO: This interval logic is duplicated in the widget, should be extracted to a custom hook
    useEffect(() => {
        const start = new Date(tracker.start_time).getTime();
        const interval = setInterval(() => {
            setSecondsClean(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [tracker.start_time]);

    // TODO: This logic is duplicated in the widget, should be extracted to a custom hook
    const handleLogUrge = async () => {
        if (!trigger.trim()) return;
        setIsSaving(true);
        await supabase
            .from('urges')
            .insert({ trigger, intensity, tracker_id: tracker.id });
        setTrigger('');
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const milestones = [
        { label: '1 Day', s: 86400 },
        { label: '7 Days', s: 604800 },
        { label: '30 Days', s: 2592000 },
        { label: '90 Days', s: 7776000 },
    ];

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
            {/* Header */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold px-3 py-1 rounded-full">
                        {tracker.addiction}
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        {expanded ? 'collapse ↑' : 'expand ↓'}
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                        CURRENT STREAK
                    </p>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
                        {formatTime(secondsClean)}
                    </h2>

                    {editingStart ? (
                        <div className="flex justify-center">
                            <DatePicker
                                value={tracker.start_time ?? ''}
                                onChange={async (iso) => {
                                    await supabase
                                        .from('recovery_profiles')
                                        .update({ start_time: iso })
                                        .eq('id', tracker.id);
                                    onUpdateStart(tracker.id, iso);
                                    setEditingStart(false);
                                }}
                                onCancel={() => setEditingStart(false)}
                            />
                        </div>
                    ) : (
                        <p
                            onClick={() => setEditingStart(true)}
                            className="text-sm text-gray-500 dark:text-zinc-400 italic cursor-pointer hover:text-purple-500 transition-colors"
                        >
                            Since{' '}
                            {new Date(tracker.start_time).toLocaleDateString()}{' '}
                            ·{' '}
                            {new Date(tracker.start_time).toLocaleTimeString(
                                [],
                                { hour: 'numeric', minute: '2-digit' },
                            )}{' '}
                            · edit
                        </p>
                    )}

                    <div className="flex justify-center gap-2 flex-wrap">
                        {milestones.map((m) => (
                            <span
                                key={m.label}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                                    secondsClean >= m.s
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-purple-50 dark:bg-zinc-900 text-purple-600 dark:text-purple-400'
                                }`}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowUrgeForm(!showUrgeForm)}
                        className="py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    >
                        Log urge
                    </button>
                    <button
                        onClick={() => onReset(tracker.id)}
                        className="py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {showUrgeForm && (
                    <div className="space-y-3">
                        <textarea
                            placeholder="What triggered it?"
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-20"
                        />
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-zinc-400">
                                Intensity: {intensity}/10
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={intensity}
                                onChange={(e) =>
                                    setIntensity(Number(e.target.value))
                                }
                                className="w-full accent-purple-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleLogUrge}
                                disabled={isSaving || !trigger.trim()}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowUrgeForm(false);
                                    setTrigger('');
                                }}
                                className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded calendar */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
                    <CalendarView
                        startTime={tracker.start_time}
                        relapses={relapses}
                    />
                </div>
            )}
        </div>
    );
}
