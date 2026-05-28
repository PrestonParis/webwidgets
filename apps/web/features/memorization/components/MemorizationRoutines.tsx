'use client';

import { useState } from 'react';
import { Check, CircleAlert, Plus, Repeat2 } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import type { MemoryRoutineRecord } from '../hooks/useMemorization';
import { DomainMark } from './MemorizationShared';

interface MemorizationRoutinesProps {
    routines: MemoryRoutineRecord[];
    toggleRoutine: (id: string) => Promise<void>;
    createRoutine: (data: {
        title: string;
        domain: string;
        minutes: number;
    }) => Promise<void>;
    loading: boolean;
}

export function MemorizationRoutines({
    routines,
    toggleRoutine,
    createRoutine,
    loading,
}: MemorizationRoutinesProps) {
    const toast = useToastContext();
    const [showRoutineForm, setShowRoutineForm] = useState(false);
    const [routineTitle, setRoutineTitle] = useState('');
    const [routineDomain, setRoutineDomain] = useState('General');
    const [routineMinutes, setRoutineMinutes] = useState('10');
    const [routineSubmitting, setRoutineSubmitting] = useState(false);

    async function handleCreateRoutine(e: React.FormEvent) {
        e.preventDefault();
        if (!routineTitle.trim()) return;
        setRoutineSubmitting(true);
        try {
            await createRoutine({
                title: routineTitle.trim(),
                domain: routineDomain,
                minutes: Number(routineMinutes) || 10,
            });
            setRoutineTitle('');
            setRoutineDomain('General');
            setRoutineMinutes('10');
            setShowRoutineForm(false);
            toast.success('Routine created.');
        } catch {
            toast.error('Failed to create routine.');
        } finally {
            setRoutineSubmitting(false);
        }
    }

    return (
        <aside className="space-y-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Repeat2 size={17} className="text-blue-500" />
                        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                            Review routines
                        </h2>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => setShowRoutineForm(true)}
                    >
                        Add
                    </Button>
                </div>

                {showRoutineForm && (
                    <form
                        onSubmit={(e) => {
                            void handleCreateRoutine(e);
                        }}
                        className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 space-y-2"
                    >
                        <input
                            value={routineTitle}
                            onChange={(e) => setRoutineTitle(e.target.value)}
                            placeholder="Routine title"
                            required
                            className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={routineDomain}
                                onChange={(e) =>
                                    setRoutineDomain(e.target.value)
                                }
                                className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            >
                                <option value="General">General</option>
                                <option value="Reading">Reading</option>
                                <option value="Knowledge">Knowledge</option>
                                <option value="Language">Language</option>
                                <option value="Fitness">Fitness</option>
                                <option value="Workflows">Workflows</option>
                            </select>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={routineMinutes}
                                onChange={(e) =>
                                    setRoutineMinutes(e.target.value)
                                }
                                placeholder="Minutes"
                                className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={routineSubmitting}
                            >
                                {routineSubmitting ? 'Creating…' : 'Create'}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowRoutineForm(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {!loading && routines.length === 0 ? (
                    <div className="rounded-lg bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-950">
                        No routines yet. Add one to schedule regular review
                        sessions.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {routines.map((routine) => (
                            <button
                                key={routine.id}
                                type="button"
                                onClick={() => void toggleRoutine(routine.id)}
                                className="rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <DomainMark domain={routine.domain} />
                                        <h3 className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                            {routine.title}
                                        </h3>
                                    </div>
                                    <span
                                        className={cn(
                                            'flex h-6 w-6 items-center justify-center rounded-full',
                                            routine.enabled
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-950',
                                        )}
                                    >
                                        <Check size={13} />
                                    </span>
                                </div>
                                {routine.description && (
                                    <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                        {routine.description}
                                    </p>
                                )}
                                <p className="mt-3 text-xs font-medium text-zinc-500">
                                    {routine.minutes} min
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-2">
                    <CircleAlert size={17} className="text-amber-500" />
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        Import suggestions
                    </h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Connect your Reading workspace or upload flashcard files to
                    import cards automatically. Coming soon.
                </p>
            </section>
        </aside>
    );
}
