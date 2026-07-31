'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';

interface Goal {
    id: string;
    name: string;
    target: number;
    current: number;
    createdAt: string;
}

function loadGoals(): Goal[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem('finance_goals') ?? '[]');
    } catch {
        return [];
    }
}

function saveGoals(goals: Goal[]) {
    localStorage.setItem('finance_goals', JSON.stringify(goals));
}

interface Props {
    monthlySavings: number;
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
}

export function GoalsPanel({
    monthlySavings,
    formatAmount,
    amountClassName,
}: Props) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');

    useEffect(() => {
        setGoals(loadGoals());
    }, []);

    function addGoal() {
        const t = parseFloat(target);
        const c = parseFloat(current) || 0;
        if (!name.trim() || isNaN(t) || t <= 0) return;
        const next = [
            ...goals,
            {
                id: crypto.randomUUID(),
                name: name.trim(),
                target: t,
                current: c,
                createdAt: new Date().toISOString(),
            },
        ];
        setGoals(next);
        saveGoals(next);
        setName('');
        setTarget('');
        setCurrent('');
        setAdding(false);
    }

    function removeGoal(id: string) {
        const next = goals.filter((g) => g.id !== id);
        setGoals(next);
        saveGoals(next);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Financial Goals
                </p>
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                    <Plus size={12} />
                    Add goal
                </button>
            </div>

            {adding && (
                <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        New Goal
                    </p>
                    <input
                        autoFocus
                        placeholder="Goal name (e.g. Emergency fund)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Target amount"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                            type="number"
                            placeholder="Saved so far"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className="text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addGoal}
                            className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg py-1.5 font-medium transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setAdding(false)}
                            className="flex-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg py-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {goals.length === 0 && !adding && (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 p-6 text-center">
                    <Target
                        size={24}
                        className="mx-auto mb-2 text-gray-300 dark:text-zinc-600"
                    />
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        No goals yet. Add your first financial goal.
                    </p>
                </div>
            )}

            {goals.map((goal) => {
                const pct = Math.min(
                    100,
                    Math.round((goal.current / goal.target) * 100),
                );
                const remaining = Math.max(0, goal.target - goal.current);
                const monthsToCompletion =
                    monthlySavings > 0
                        ? Math.ceil(remaining / monthlySavings)
                        : null;

                return (
                    <div
                        key={goal.id}
                        className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                    {goal.name}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                    <span
                                        className={`font-semibold ${amountClassName ?? ''} text-gray-700 dark:text-zinc-300`}
                                    >
                                        {formatAmount(goal.current, 'USD', 0)}
                                    </span>{' '}
                                    of{' '}
                                    <span
                                        className={`font-semibold ${amountClassName ?? ''}`}
                                    >
                                        {formatAmount(goal.target, 'USD', 0)}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => removeGoal(goal.id)}
                                className="text-gray-300 dark:text-zinc-600 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden mb-2">
                            <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-400' : 'bg-emerald-500/60'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 dark:text-zinc-500">
                                {pct}% complete
                            </span>
                            {monthsToCompletion !== null && remaining > 0 && (
                                <span className="text-emerald-500">
                                    ~{monthsToCompletion}mo at current savings
                                </span>
                            )}
                            {remaining === 0 && (
                                <span className="text-emerald-500 font-semibold">
                                    Goal reached!
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
