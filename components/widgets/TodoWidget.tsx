'use client';

import { useState, useRef, FormEvent } from 'react';
import { CheckSquare, X } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useTodos } from '@/hooks/tracking/useTodos';
import { Checkmark } from '@/icons/CheckMark';

const MAX_VISIBLE = 7;

export default function TodoWidget() {
    const { settings, updateSettings } = useWidgetSettings('todo', 'todo');
    const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await addTodo(input);
        setInput('');
        inputRef.current?.focus();
    };

    const incomplete = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const visible = [...incomplete, ...completed].slice(0, MAX_VISIBLE);

    return (
        <WidgetShell
            icon={<CheckSquare size={16} />}
            title="To-Do"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {/* Quick-add form */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add a task…"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded-xl transition-colors"
                >
                    Add
                </button>
            </form>

            {/* Todo list */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-8 bg-stone-100 dark:bg-zinc-800 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-stone-400 dark:text-zinc-600">
                    <CheckSquare size={28} className="mb-2 opacity-40" />
                    <p className="text-xs">All clear — nothing to do!</p>
                </div>
            ) : (
                <ul className="space-y-1">
                    {visible.map((todo) => (
                        <li
                            key={todo.id}
                            className="group flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                    todo.completed
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-stone-300 dark:border-zinc-600 hover:border-blue-400'
                                }`}
                            >
                                {todo.completed && <Checkmark size={10} />}
                            </button>
                            <span
                                className={`flex-1 text-sm truncate ${
                                    todo.completed
                                        ? 'line-through text-stone-400 dark:text-zinc-600'
                                        : 'text-stone-700 dark:text-zinc-300'
                                }`}
                            >
                                {todo.text}
                            </span>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all"
                            >
                                <X size={13} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {todos.length > MAX_VISIBLE && (
                <p className="mt-3 text-xs text-center text-stone-400 dark:text-zinc-600">
                    +{todos.length - MAX_VISIBLE} more tasks
                </p>
            )}
        </WidgetShell>
    );
}
