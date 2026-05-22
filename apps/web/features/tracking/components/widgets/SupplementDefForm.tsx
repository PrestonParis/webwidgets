'use client';

import { useState } from 'react';
import type {
    SupplementScheduleType,
    CreateSupplementPayload,
} from '@/features/tracking/types/supplement';

interface Props {
    onSubmit: (payload: CreateSupplementPayload) => Promise<void>;
    onCancel: () => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-400';
const labelCls =
    'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1';

const SCHEDULE_OPTS: {
    value: SupplementScheduleType;
    label: string;
    hint: string;
}[] = [
    { value: 'by_time', label: 'By time', hint: 'Must be taken by a deadline' },
    {
        value: 'after_time',
        label: 'After time',
        hint: 'Take after a certain time',
    },
    { value: 'window', label: 'Window', hint: 'Take within a time range' },
];

export function SupplementDefForm({ onSubmit, onCancel }: Props) {
    const [basics, setBasics] = useState({ name: '', dose: '' });
    const [sched, setSched] = useState<{
        type: SupplementScheduleType;
        start: string;
        end: string;
    }>({
        type: 'by_time',
        start: '08:00',
        end: '10:00',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!basics.name.trim()) return;
        setSaving(true);
        await onSubmit({
            name: basics.name.trim(),
            ...(basics.dose.trim() && { dose: basics.dose.trim() }),
            scheduleType: sched.type,
            scheduleStart: sched.start,
            ...(sched.type === 'window' && { scheduleEnd: sched.end }),
        });
        setSaving(false);
    };

    const startLabel =
        sched.type === 'by_time'
            ? 'Deadline'
            : sched.type === 'after_time'
              ? 'After'
              : 'From';

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
            className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-800"
        >
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>Supplement</label>
                    <input
                        type="text"
                        placeholder="e.g. Vitamin D"
                        value={basics.name}
                        onChange={(e) =>
                            setBasics((p) => ({ ...p, name: e.target.value }))
                        }
                        className={inputCls}
                        autoFocus
                    />
                </div>
                <div>
                    <label className={labelCls}>Dose (optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. 2000 IU"
                        value={basics.dose}
                        onChange={(e) =>
                            setBasics((p) => ({ ...p, dose: e.target.value }))
                        }
                        className={inputCls}
                    />
                </div>
            </div>

            <div>
                <label className={labelCls}>Schedule type</label>
                <div className="grid grid-cols-3 gap-1">
                    {SCHEDULE_OPTS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            title={opt.hint}
                            onClick={() =>
                                setSched((p) => ({ ...p, type: opt.value }))
                            }
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                sched.type === opt.value
                                    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 text-purple-700 dark:text-purple-300'
                                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className={labelCls}>{startLabel}</label>
                    <input
                        type="time"
                        value={sched.start}
                        onChange={(e) =>
                            setSched((p) => ({ ...p, start: e.target.value }))
                        }
                        className={inputCls}
                    />
                </div>
                {sched.type === 'window' && (
                    <div className="flex-1">
                        <label className={labelCls}>Until</label>
                        <input
                            type="time"
                            value={sched.end}
                            onChange={(e) =>
                                setSched((p) => ({ ...p, end: e.target.value }))
                            }
                            className={inputCls}
                        />
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!basics.name.trim() || saving}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                    {saving ? 'Saving…' : 'Add supplement'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
