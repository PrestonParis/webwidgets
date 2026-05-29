'use client';

import { useRef, useState } from 'react';
import { Check, CheckSquare, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { Todo } from '@/features/todo/types/todo';
import { PlanningWeatherSection } from '@/features/weather/components/PlanningWeatherSection';

interface PlanningTodayPanelProps {
    today: Date;
    todos: Todo[];
    loading: boolean;
    todayEventCount: number;
    onAddTodo: (text: string) => Promise<void>;
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
}

const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export function PlanningTodayPanel({
    today,
    todos,
    loading,
    todayEventCount,
    onAddTodo,
    onToggleTodo,
    onDeleteTodo,
}: PlanningTodayPanelProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const incomplete = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const visible = [...incomplete, ...completed];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        await onAddTodo(input.trim());
        setInput('');
        inputRef.current?.focus();
    }

    return (
        <aside className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {/* Date header */}
            <div className="px-4 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    {DAY_NAMES[today.getDay()]}
                </p>
                <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 leading-none mt-1">
                    {today.getDate()}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                </p>
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {incomplete.length} task
                        {incomplete.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {todayEventCount} event
                        {todayEventCount !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Weather */}
            <PlanningWeatherSection />

            {/* Tasks */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        <CheckSquare size={12} />
                        Tasks
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                    className="px-3 pb-2"
                >
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors">
                        <Plus size={12} className="text-zinc-400 shrink-0" />
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Add a task…"
                            className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>
                </form>

                <ul className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
                    {loading && (
                        <div className="space-y-1.5 px-1 pt-1">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    )}
                    {!loading && visible.length === 0 && (
                        <li className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-4">
                            All clear!
                        </li>
                    )}
                    {visible.map((todo) => (
                        <li
                            key={todo.id}
                            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <button
                                onClick={() => void onToggleTodo(todo.id)}
                                className={cn(
                                    'w-3.5 h-3.5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                                    todo.completed
                                        ? 'bg-indigo-500 border-indigo-500'
                                        : 'border-zinc-300 dark:border-zinc-600 hover:border-indigo-400',
                                )}
                            >
                                {todo.completed && (
                                    <Check size={9} className="text-white" />
                                )}
                            </button>
                            <span
                                className={cn(
                                    'flex-1 text-xs truncate',
                                    todo.completed
                                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                                        : 'text-zinc-700 dark:text-zinc-300',
                                )}
                            >
                                {todo.text}
                            </span>
                            <button
                                onClick={() => void onDeleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                            >
                                <X size={10} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
